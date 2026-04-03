## Context

当前课程老师关系以课程维度为主，难以承载“教学组内多老师”的后续批量导入场景。需求已新增 `course_teaching_group`、`course_group_teacher` 表，并在 `invitaion_code` 增加 `teaching_group` 字段，要求学生可通过邀请码加入指定课程教学组。

现状约束：
- 管理端接口需使用管理员 JWT（`@AdminAuth()` + `@Role()`）。
- 课程、邀请码相关接口需输出 `Result<T>`，并补齐 Swagger(OpenAPI 3.0) 注解。
- 邀请码策略沿用学校邀请码：MySQL 留痕 + Redis 缓存 + 定时清理。

## Goals / Non-Goals

**Goals:**
- 课程创建后自动初始化教学组（默认组）。
- 提供课程老师绑定接口，支持“教学组-老师”关系同步，且服务层可复用给后续批量导入。
- 提供按学校与姓名前缀检索老师 ID/姓名的接口，供教学组绑定选人。
- 提供课程邀请码生成能力，邀请码与 school/course/teaching_group 强绑定。
- 明确学生使用邀请码加入课程教学组的校验边界。
- 扩展课程基础信息查询，返回邀请码、创建时间、持续时间。
- 明确实体变更（`course_student`、`course_teaching_group`、`course_group_teacher`、`invitaion_code`）与接口契约。

**Non-Goals:**
- 不实现教师批量导入入口，仅预留复用服务。
- 不重构历史所有课程管理接口返回结构。
- 不扩展邀请码到非课程业务。

## Decisions

### 1) 关系建模决策：教学组为老师绑定唯一入口
- 决策：以 `course_teaching_group` + `course_group_teacher` 作为课程任课老师关系的唯一写入模型。
- 方案：
  - 课程创建成功后自动创建默认教学组（如“默认教学组”），与课程一对多。
  - 老师绑定通过“同步接口”覆盖目标教学组老师集合（新增缺失、移除多余）。
  - 教学组绑定结果 MUST 同步投影到 `course_teacher`，确保课程老师维度查询一致。
- 备选：继续直接写课程-老师关系表。放弃原因：无法表达多教学组、后续批量导入复用差。

### 2) 服务复用决策：抽离教学组老师同步服务
- 决策：新增可复用方法（例如 `syncTeachingGroupTeachers`），由管理端接口与未来批量导入共用。
- 输入：`course_id`、`teaching_group_id`、`teacher_ids[]`、`operator_id`。
- 输出：变更摘要（新增数量、移除数量、最终老师列表）。
- 备选：在 controller 内直接 CRUD。放弃原因：重复逻辑高，难复用于批量导入。

### 3) 邀请码决策：MySQL 记账 + Redis 发码态缓存
- 决策：生成邀请码时先写 `invitaion_code`（含 `teaching_group`），再写 Redis（TTL）。
- 校验：发码时教师必须已绑定到目标课程教学组；兑换时必须校验 code 有效、未过期、学校匹配、课程匹配、教学组存在。
- 清理：定时任务扫描并失效过期记录，同时删除 Redis 残留键。
- 备选：仅存 Redis。放弃原因：审计与追踪不足。

邀请码使用次数策略：
- 课程邀请码不设置使用次数上限（不限次数），不引入 `max_uses` 字段。
- 学生重复使用邀请码加入同一课程时，返回“已加入该课程”提示，不再重复写入。

### 4) OpenAPI 3.0 接口契约（新增/修改）
- 修改接口：POST /course/createCourseAdmin
  - 请求体：CreateCourseDto（沿用现有字段）。
  - 新行为：创建课程成功后，自动创建默认教学组。
  - 响应：Result<{ id: string }>
- 新增接口：POST /course/createTeachingGroupAdmin
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 请求体：
    - course_id: string（必填）
    - name: string（必填）
  - 响应：Result<{ id: string; course_id: string; name: string; teachers: string[] }>
  - 说明：创建教学组不生成/返回教学组邀请码，邀请码需通过教学组ID到 `invitaion_code` 表查询
- 新增接口：GET /course/listTeachingGroupAdmin
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 查询参数：
    - course_id: string（必填）
    - page/pageSize: number（可选，默认 1/10）
  - 响应：Result<{ list: Array<{ id: string; course_id: string; name: string; teachers: string[]; create_time?: string; invitation_create_time: string | null; invitation_code: string | null; invitation_ttl: number | null }>; total: number }>
- 新增接口：GET /course/getTeachingGroupAdmin/:id
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 路径参数：
    - id: string（教学组ID）
  - 响应：Result<{ id: string; course_id: string; name: string; teachers: string[]; create_time?: string; invitation_create_time: string | null; invitation_ttl: number | null }>
- 新增接口：PUT /course/updateTeachingGroupAdmin
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 请求体：
    - teaching_group_id: string（必填）
    - name: string（必填）
  - 响应：Result<{ id: string; updated: true }>
- 新增接口：DELETE /course/deleteTeachingGroupAdmin/:id
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 路径参数：
    - id: string（教学组ID）
  - 响应：Result<{ id: string; deleted: true }>
  - 约束：删除前需校验不可删除课程最后一个教学组，且该教学组下无学生、无未失效邀请码
- 新增接口：PUT /course/bindTeachingGroupTeachersAdmin
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 请求体：
    - course_id: string（必填）
    - teaching_group_id: string（必填）
    - teacher_ids: string[]（必填，至少 1）
  - 响应：Result<{ course_id: string; teaching_group_id: string; teacher_ids: string[]; updated: true }>
- 新增接口：GET /course/querySchoolTeacherByNameAdmin
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 查询参数：
    - school_id: string（平台管理员必填；学校管理员可选，若传入必须等于所属学校）
    - name: string（必填，按前缀匹配）
    - page/pageSize: number（可选，默认 1/10）
  - 匹配规则：`name` 必须执行左到右前缀匹配（SQL 语义 `LIKE :name%`），不得使用包含匹配（`%name%`）
  - 响应：Result<{ list: Array<{ id: string; name: string }>; total: number }>
- 新增接口：POST /invitation/createCourseInvitationCode
  - 鉴权：管理员 JWT 或同校教师 JWT（需角色守卫）
  - 请求体：
    - school_id: string（教师侧可省略，由服务端推导）
    - course_id: string（必填）
    - teaching_group: string（必填）
    - expire_seconds: number（可选，>0）
  - 响应：Result<{ code: string; type: string; course_id: string; teaching_group: string; createTime: string; ttl: number | null; expire_time: string }>
  - 权限边界：教师发码前必须校验其已绑定到该 `course_id + teaching_group`
- 新增/调整接口：POST /student/joinCourseByInviteCode
  - 鉴权：用户端 JWT（学生）
  - 请求体：{ code: string }
  - 行为：基于邀请码将学生加入课程与教学组，并写 `course_student`；若学生已加入该课程，返回“已加入该课程”提示。
  - 响应：Result<{ course_id: string; teaching_group: string; joined: true }>
- 说明：教学组 CRUD 中除创建、列表外，详情/更新/删除均基于教学组 ID 操作，便于前端独立教学组配置页按 `teaching_group_id` 维护。
- 修改接口：GET /course/getCourseBasicAdmin/:id
  - 鉴权：@AdminAuth() + @Role(平台/学校管理员)
  - 响应：沿用课程基础字段，不返回邀请码与教学组相关字段

### 5) TypeORM 实体变更决策
- `course_teaching_group`：新增实体或补齐字段（id, course_id, name, sort_order, create_time, update_time）。
- `course_group_teacher`：补齐字段（id, teaching_group_id, teacher_id, create_time, update_time）。
- `course_student`：按新表结构补齐与教学组关联字段。
- `invitaion_code`：新增 `teaching_group` 字段映射，保持与真实表一致。
- 约束：实体字段必须以 MySQL MCP 查询结果为准，避免与真实表偏差。

### 6) 老师检索决策：严格前缀匹配并按学校隔离
- 决策：老师检索接口仅返回本校范围老师，姓名匹配采用前缀方式。
- 规则：`name='a'` 时，`alice` 可命中，`bac` 不可命中。
- 备选：包含匹配 `%name%`。放弃原因：误命中高且不符合产品输入联想预期。

### 7) 课程基础信息邀请码聚合决策
- 决策：课程基础信息接口不返回邀请码与教学组相关信息，邀请码信息由独立邀请码接口提供。

## Risks / Trade-offs

- [MySQL 与 Redis 双写不一致] → 先写 MySQL 再写 Redis；Redis 失败时标记记录不可用并告警，定时任务补偿。
- [历史课程无默认教学组] → 提供一次性回填脚本，按课程创建默认组并迁移既有老师关系。
- [教师越权发码] → 生成邀请码时强制校验教师与课程同校，且已绑定到目标课程教学组。
- [邀请码并发兑换] → 使用 Redis 原子扣减或唯一入课约束，防止超发与重复入课。
- [老师检索慢查询风险] → 对学校+姓名前缀建立联合索引，分页返回并限制 `pageSize` 上限。
- [course_group_teacher 与 course_teacher 一致性风险] → 统一通过同一事务同步两张关系表，避免脏数据。

## Migration Plan

1. 执行数据库迁移，确保四张表结构与索引到位。
2. 发布回填任务：为存量课程创建默认教学组并迁移历史老师绑定。
3. 发布后端新接口与 DTO/Swagger 契约。
4. 启用邀请码定时清理任务并观察 Redis 命中与过期率。
5. 回滚策略：关闭新接口入口；保留历史数据，不做破坏性删表。

## Open Questions

- 暂无（当前关键业务规则已确认：邀请码不限次数、重复入课提示已加入、教师发码需绑定教学组、课程基础信息仅返回未过期邀请码）。
