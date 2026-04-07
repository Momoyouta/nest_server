## Context

当前用户端认证链路存在三个核心问题：
1. 用户 token 不携带 schoolId，服务端在多处通过查询 teacher/student 表反推学校，查询分散且易出现口径不一致。
2. ALS 仅沉淀了 userId/platform/roleIds，未沉淀 schoolId 与操作者身份（teacher_id/student_id），导致业务接口仍需手传 `school_id`、`teacher_id`、`student_id`。
3. 登录后无法完成“选校再进入业务”流程，无法稳定支撑多租户切换场景。

现状可见改造点：
- `POST /auth/login` 当前直接签发业务 token。
- 用户端课程与学习进度接口仍要求手工传身份参数：
  - `GET /course/listTeacherCoursesUser`（`teacher_id`、`school_id?`）
  - `GET /course/listStudentCoursesUser`（`student_id`、`school_id?`）
  - `POST /course/sync-progress`（`schoolId`）
  - `POST /course/getLearningProgress`（`schoolId`）

## Goals / Non-Goals

**Goals:**
- 用户端登录改为“两阶段令牌”：先登录成功，再选学校，最后拿到含 `schoolId` 的业务 token。
- 在 AuthGuard 解析 token 后，将 `userId`、`roleIds`、`schoolId`、`teacherId/studentId` 注入 ALS，业务层统一读取。
- 用户端“本人接口”移除手工传 `school_id`、`teacher_id`、`student_id`。
- 保持 AdminJWTAuth 与管理端鉴权逻辑不变。
- 所有新增/改造接口补齐 OpenAPI 3.0 与 class-validator 约束。

**Non-Goals:**
- 不改造管理端 token（`/auth/admin/*`）及 AdminAuth 守卫策略。
- 不在本次变更中重构全部历史业务，仅覆盖用户端 auth 与“本人接口”关键链路。
- 不引入跨租户数据共享。

## Decisions

### 决策1：用户端改为两阶段 token 模型

**方案**
- 阶段1（登录）：`POST /auth/login` 返回 `pendingToken`（不含 `schoolId`）与 `selectableSchools`。
- 阶段2（选校）：`POST /auth/selectSchool` 使用 `pendingToken` + `schoolId` 换发 `accessToken`（含 `schoolId`）。
- 切校：`POST /auth/switchSchool` 使用当前 `accessToken` + 目标 `schoolId` 换发新 `accessToken`。

**token 声明约定（用户端）**
- `pendingToken`：`{ userId, roleIds, roles, tokenType: 'pending-school', selectableSchoolIds, exp }`
- `accessToken`：`{ userId, roleIds, roles, schoolId, actorType, actorId, tokenType: 'access', exp }`

**备选方案**
- 登录即默认绑定一个 schoolId，不提供选校步骤。
- 放弃原因：无法满足“登录后手动选校”业务要求，且不支持后续切校。

### 决策2：扩展 ALS 上下文并统一消费

**方案**
- 扩展 `RequestContext`：新增 `schoolId`、`actorType`（teacher/student）、`actorId`、`roleIds`（统一为 string[]）。
- `AuthGuard` 在用户端 token 验证成功后写入上述字段。
- `AsyncLocalstorageService` 新增 `getSchoolId()`、`getActorId()`、`getActorType()`。

**约束**
- 业务层不得再信任客户端传入的本人身份参数；本人身份必须由 ALS 派生。
- 若 token 不含 `schoolId`（pending token），仅允许访问选校相关接口，访问业务接口返回 401/403。

### 决策3：数据库表改造（支持多租户身份映射）

**新增表：`user_school_identity`**
- 用途：维护“用户在学校下的身份实例”，支持同一用户在多个学校、多个身份间切换。
- 字段：
  - `id` varchar(255) PK
  - `user_id` varchar(255) NOT NULL
  - `school_id` varchar(255) NOT NULL
  - `actor_type` tinyint NOT NULL COMMENT '1-teacher, 2-student'
  - `actor_id` varchar(255) NOT NULL COMMENT 'teacher.id 或 student.id'
  - `status` tinyint NOT NULL DEFAULT 1
  - `create_time` varchar(20) NULL
  - `update_time` varchar(20) NULL
- 索引：
  - UNIQUE `uk_user_school_actor` (`user_id`,`school_id`,`actor_type`)
  - INDEX `idx_user_school` (`user_id`,`school_id`)
  - INDEX `idx_actor` (`actor_type`,`actor_id`)

**兼容策略**
- `teacher`、`student` 表继续保留；认证与鉴权以 `user_school_identity` 为主映射来源。
- 数据回填：由现有 `teacher`、`student` 记录初始化写入 `user_school_identity`。

### 决策4：OpenAPI 接口改造清单

**新增接口**
1. `POST /auth/selectSchool`
- 鉴权：用户 `pendingToken`（Bearer）
- Request Body:
  - `schoolId`: string, `@IsString()` + `@IsNotEmpty()`
- Response `Result.data`:
  - `token`: string（业务 token）
  - `baseUserInfo`: `{ userId, userRoles, userName, schoolId }`
  - `userProfile`: 当前学校上下文下资料

2. `POST /auth/switchSchool`
- 鉴权：用户 `accessToken`
- Request Body:
  - `schoolId`: string, `@IsString()` + `@IsNotEmpty()`
- Response `Result.data`:
  - `token`: string（新 schoolId token）
  - `schoolId`: string

3. `GET /auth/schools`
- 鉴权：用户 `pendingToken` 或 `accessToken`
- Response `Result.data`:
  - `schools`: `{ schoolId, schoolName, actorType, actorId }[]`

**改造接口（本人参数去除）**
1. `GET /course/listTeacherCoursesUser`
- 删除 Query: `teacher_id`、`school_id`
- 保留 Query: `page`、`pageSize`
- 服务端改为 `als.userId + als.schoolId + als.actorId` 定位教师身份。

2. `GET /course/listStudentCoursesUser`
- 删除 Query: `student_id`、`school_id`
- 保留 Query: `page`、`pageSize`
- 服务端改为 `als.userId + als.schoolId + als.actorId` 定位学生身份。

3. `POST /course/sync-progress`
- 删除 Body: `schoolId`
- 保留 Body: `courseId`、`chapterId`、`lessonId`、`progress_percent`
- 校验：从 ALS 取 schoolId，校验该学生是否属于当前学校。

4. `POST /course/getLearningProgress`
- 删除 Body: `schoolId`
- 保留 Body: `courseId`
- 查询条件中的 schoolId 从 ALS 注入。

### 决策5：鉴权与守卫约束

- `@AdminAuth()` 与 `/auth/admin/*` 完全保持原行为。
- 用户端接口继续使用用户 JWT；若为本人接口，必须依赖 ALS 而非外部传参。
- `RoleGuard` 不改协议，仅消费 `AuthGuard` 注入的角色信息。

## Risks / Trade-offs

- [风险] 历史 token 不含 `schoolId`，升级窗口可能出现兼容问题
  → [缓解] 增加灰度期：无 `schoolId` token 仅允许访问 `/auth/schools`、`/auth/selectSchool`。

- [风险] `user_school_identity` 回填不完整会导致选校列表缺失
  → [缓解] 发布前执行回填校验 SQL，并提供一次性修复脚本。

- [风险] 接口去参后前端短期仍传旧字段
  → [缓解] 过渡期 DTO 将旧字段标为可选并忽略，发布公告后再移除。

- [风险] ALS 上下文字段增加导致部分服务未适配
  → [缓解] 在任务中加入“本人接口检查清单”，逐模块验证。

## Migration Plan

1. 新增 `user_school_identity` 表并创建索引。
2. 从 `teacher`、`student` 表回填 `user_school_identity` 基础数据。
3. 发布认证接口改造：上线 `pendingToken`、`selectSchool`、`switchSchool`、`schools`。
4. 扩展 `RequestContext` 与 `AuthGuard`，将 school/actor 上下文写入 ALS。
5. 改造用户端“本人接口”DTO 与服务实现，移除 `school_id`、`teacher_id`、`student_id` 必填入参。
6. 观察期通过后移除兼容逻辑（旧字段忽略逻辑与旧响应结构）。

## Open Questions

- 同一用户在同一学校同时拥有 teacher 与 student 身份时，`actorType` 的默认选择策略是否由前端显式指定？
- `pendingToken` 的有效期是否统一为 10 分钟，还是按环境可配置？
