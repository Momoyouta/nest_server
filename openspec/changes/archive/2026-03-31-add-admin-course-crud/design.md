## Context

当前项目已有学校、用户等管理端接口模式（Controller 路由 + @AdminAuth + Result<T> 返回），但尚未提供课程管理端统一 CRUD。课程主表与关联表（course_chapter、course_lesson、course_teacher、teacher、user）已存在，可支撑列表聚合字段输出，无需新增业务域。

约束与现状：
- 本次仅实现管理端接口，后续 courseController 可能并入用户端接口，但本次不包含。
- 创建课程需要从 ALS 获取操作者 userId，不允许客户端伪造 creator_id。
- 学校管理员必须落在自身学校范围内；平台管理员可跨学校操作但需显式传入并校验 school_id。
- 软删除不做物理删除，仅将课程状态回退为未发布。

## Goals / Non-Goals

**Goals:**
- 新增管理端课程创建、更新、硬删除、软删除、列表查询接口，并统一使用 @AdminAuth。
- 明确不同管理员角色的 school_id 写入与校验策略。
- 列表接口支持分页与条件查询，返回章节数、总课时数、任课老师姓名、创建者姓名，且不返回 description。
- 完整补充 OpenAPI 3.0 契约、DTO 校验规则和标准化错误响应。

**Non-Goals:**
- 不实现课程详情接口（不做完整多表明细查询）。
- 不实现用户端课程接口。
- 不新增课程相关数据库表。

## Decisions

### 1) API 边界与 OpenAPI 3.0 契约
管理端统一前缀为 /course，所有接口必须标注 @AdminAuth，且 URL 采用“动词+名称+辅助标识”风格。

1. POST /course/createCourseAdmin
- Request Body: CreateCourseDto
  - name: string, 必填, @IsString @IsNotEmpty @MaxLength(255)
  - school_id: string, 平台管理员必填，学校管理员忽略客户端传值
  - cover_img: string, 可选, @IsString @MaxLength(500)
  - description: string, 可选, @IsString
- Response: Result<{ id: string }>

2. PUT /course/updateCourseAdmin
- Request Body: UpdateCourseDto
  - id: string, 必填
  - name/cover_img/description/status: 可选字段，按 DTO 约束校验
- Response: Result<{ id: string; updated: true }>

3. DELETE /course/hardDeleteCourseAdmin/:id
- Path Param: id:string
- Response: Result<{ id: string; deleted: true; mode: "hard" }>

4. PUT /course/softDeleteCourseAdmin/:id
- Path Param: id:string
- Response: Result<{ id: string; deleted: true; mode: "soft" }>

5. GET /course/listCourseAdmin
- Query: page(>=1), pageSize(>=1), keyword(可选), status(0|1, 可选), school_id（平台管理员必填）
- Response: Result<{ list: CourseListItem[]; total: number }>
- CourseListItem 不返回 description，包含：
  - id, school_id, creator_id, name, cover_img, status, create_time, update_time
  - chapter_count: number
  - total_lesson_count: number
  - teacher_names: string[]
  - creator_name: string

### 2) 角色与 school_id 决策
- 从 ALS 获取 userId，再查询用户角色。
- 学校管理员（school_root/school_admin）：
  - create/update/list 强制使用其所属 school_admin.school_id。
  - 若请求体或查询参数携带不同 school_id，直接拒绝（403 或 400）。
- 平台管理员（root/admin）：
  - create 与 list 必须传 school_id；update/delete 需校验课程存在。

备选方案：仅依赖前端传 school_id。
- 放弃原因：存在越权风险，无法保证学校管理员操作边界。

### 3) 课程状态与删除策略
- 创建课程默认 status=UNPUBLISHED(0)，忽略客户端传入的初始状态。
- 软删除：将 status 更新为 UNPUBLISHED，并写入 update_time。
- 硬删除：在事务内先清理 course_chapter/course_lesson/course_teacher/course_student/course_learning_record/course_assignment/course_assignment_question/assignment_submission/assignment_answer_detail 等关联数据，再删除 course 主记录。

备选方案：新增 deleted 字段做逻辑删除。
- 放弃原因：当前需求已定义“软删除=未发布”，无需引入额外状态维度。

### 4) 列表聚合查询策略
- 主查询基于 course 表分页。
- 章节数：COUNT(course_chapter.id) 按 course_id 聚合。
- 总课时数：COUNT(course_lesson.id) 通过 course_chapter -> course_lesson 关联聚合。
- 任课老师姓名：course_teacher -> teacher -> user.name 聚合为字符串数组。
- 创建者姓名：course.creator_id -> user.name。

为避免分页失真，采用“先分页取课程 ID，再批量聚合补充字段”策略。

### 5) TypeORM 实体变更
- 本次不新增/修改 course、course_chapter、course_lesson、course_teacher、teacher、user 的列定义与关联关系。
- 仅新增 DTO 与查询拼装逻辑。
- 依赖现有实体时间戳字段（create_time、update_time）写入规则。

### 6) 鉴权与守卫要求
- 所有本次新增接口使用 @AdminAuth。
- 可选地对接口叠加 @Role(...AdminRoles) 以明确仅管理员可访问。
- 严禁使用 @Public()。

## Risks / Trade-offs

- [Risk] 学校管理员越权操作其他学校课程。 -> Mitigation：服务层以 ALS+角色+school_admin 映射作为唯一可信来源，忽略或拒绝外部 school_id。
- [Risk] 列表聚合查询导致性能下降。 -> Mitigation：分页主查询 + 批量聚合 + 必要索引（course_id、chapter_id、teacher_id）。
- [Risk] 硬删除后存在关联脏数据。 -> Mitigation：先按需求执行主表硬删除；若发现业务依赖再补充事务化级联策略。
- [Trade-off] 软删除定义为“未发布”而非独立删除态。 -> Mitigation：符合当前需求，后续如需回收站能力再扩展状态模型。

## Migration Plan

1. 新增 course 管理端 DTO、controller、service 方法与 Swagger 注解。
2. 联调 create/update/delete/list，并覆盖角色差异、school_id 校验、分页筛选、聚合字段正确性。
3. 发布后观察慢查询与错误日志；若有回归可通过应用回滚恢复（无表结构迁移）。

## Open Questions

- 暂无阻塞本次实现的开放问题。