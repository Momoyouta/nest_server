## 1. 数据结构与实体对齐

- [x] 1.1 使用 MySQL MCP 查询 `course_student`、`course_teaching_group`、`course_group_teacher`、`invitaion_code` 真实表结构并整理字段映射清单
- [x] 1.2 新建 `course_teaching_group`、`course_group_teacher` 实体并按真实表字段补齐 `create_time/update_time` 与 Swagger 注解
- [x] 1.3 更新 `course_student`、`invitation_code` 实体字段（含 `teaching_group` 等变更）并保持与真实表一致
- [x] 1.4 在 `src/modules/common/common/common.module.ts` 的 `entities` 常量中注册新增实体

## 2. 课程教学组与老师绑定

- [x] 2.1 改造课程创建流程：`createCourseAdmin` 成功后在同事务内创建默认教学组
- [x] 2.2 在课程服务中抽离可复用的教学组老师同步方法（供单次绑定与后续批量导入复用），并在同事务内同步维护 `course_group_teacher` 与 `course_teacher`
- [x] 2.3 新增教学组老师绑定 DTO（含 `@ApiProperty` 与 class-validator 规则）
- [x] 2.4 新增 `PUT /course/bindTeachingGroupTeachersAdmin` 控制器接口，并补齐 `@ApiTags/@ApiOperation/@ApiBody/@ApiResponse/@ApiBearerAuth`
- [x] 2.5 新增本校老师前缀检索 DTO（`school_id`、`name`、`page`、`pageSize`）并补齐 Swagger 注解
- [x] 2.6 实现 `GET /course/querySchoolTeacherByNameAdmin`：按学校隔离 + 姓名前缀匹配（`name%`）返回老师 `id/name`

## 3. 课程邀请码发放

- [x] 3.1 扩展邀请码 DTO 与数据模型，支持 `type=2` 课程邀请码及 `teaching_group` 字段（含 Swagger 注解）
- [x] 3.2 实现课程邀请码生成服务：校验课程/教学组归属后写 MySQL 与 Redis，返回邀请码与过期信息（不限使用次数）
- [x] 3.3 增加管理员与教师发码入口并统一复用同一服务逻辑，落实角色与学校权限校验（教师必须已绑定目标课程教学组）
- [x] 3.4 更新 invitation 相关控制器 Swagger 注解，确保 OpenAPI 3.0 契约完整

## 4. 学生使用邀请码加入课程

- [x] 4.1 新增学生兑换邀请码 DTO（含 `@ApiProperty` 与校验规则）
- [x] 4.2 实现兑换逻辑：校验邀请码有效性与课程教学组关系，重复加入时返回“已加入该课程”提示且不重复写入 `course_student`
- [x] 4.3 新增学生端入课接口（动词+名称风格）并补齐 Swagger 注解与 JWT/Role 鉴权

## 5. 清理与文档收口

- [x] 5.1 实现课程邀请码过期清理任务，处理 Redis 与 MySQL 不一致修复
- [x] 5.2 自查并更新受影响接口的 OpenAPI 文档展示（请求参数、权限、`Result<T>` 响应）
- [x] 5.3 本地执行 lint 与构建，修复本次改动引入的问题并整理实现说明

## 6. 课程基础信息邀请码聚合

- [x] 6.1 扩展课程基础信息响应 DTO，新增 `invitation_code`、`invitation_create_time`、`invitation_ttl` 字段与 Swagger 注解
- [x] 6.2 改造 `getCourseBasicAdmin` 服务逻辑，仅聚合未过期课程邀请码（`type=2`）并按 `create_time` 倒序取最新记录
- [x] 6.3 更新 `GET /course/getCourseBasicAdmin/:id` 控制器响应文档，明确邀请码时间信息为时间戳语义

## 7. 教学组独立 CRUD 能力

- [x] 7.1 新增教学组 CRUD DTO 与响应模型（创建/列表/详情/更新/删除）并补齐 Swagger 注解
- [x] 7.2 新增管理端教学组 CRUD 接口：`createTeachingGroupAdmin`、`listTeachingGroupAdmin`、`getTeachingGroupAdmin`、`updateTeachingGroupAdmin`、`deleteTeachingGroupAdmin`
- [x] 7.3 实现教学组 CRUD 服务逻辑并统一按教学组 ID 处理详情/更新/删除，补充权限与跨校校验
- [x] 7.4 删除教学组时补充业务约束（至少保留一个教学组、存在学生/有效邀请码禁止删除）并同步维护 `course_teacher`
- [x] 7.5 更新 OpenSpec proposal/design/spec 契约以反映教学组独立配置页面需求
