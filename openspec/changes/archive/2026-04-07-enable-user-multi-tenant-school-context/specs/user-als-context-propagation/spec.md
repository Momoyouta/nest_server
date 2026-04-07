## ADDED Requirements

### Requirement: AuthGuard 必须将租户与操作者上下文写入 ALS
系统 MUST 在用户端 token 验证成功后，将 `userId`、`roleIds`、`schoolId`、`actorType`、`actorId` 写入请求级 ALS 上下文。

#### Scenario: 业务 token 验证后写入完整上下文
- **WHEN** 用户携带包含 `schoolId` 的有效业务 token 访问受保护接口
- **THEN** `RequestContext` MUST 至少包含 `requestId`、`userId`、`platform='user'`、`roleIds`、`schoolId`、`actorType`、`actorId`

#### Scenario: 管理端 token 行为保持不变
- **WHEN** 请求命中 `@AdminAuth()` 接口并使用管理员 token
- **THEN** 系统 MUST 继续按现有管理员逻辑鉴权，且本变更不得改变 AdminJWTAuth 验证流程

### Requirement: 本人接口必须从 ALS 派生身份而非客户端传参
系统 MUST 以 ALS 上下文作为本人身份与租户身份的唯一可信来源；客户端提交的 `school_id`、`teacher_id`、`student_id` 不得作为授权依据。

#### Scenario: 课程列表接口不再要求 teacher_id/student_id
- **WHEN** 客户端调用 `GET /course/listTeacherCoursesUser` 或 `GET /course/listStudentCoursesUser`
- **THEN** 系统 MUST 通过 ALS 中的 `actorId` 与 `schoolId` 进行查询
- **THEN** 接口契约 MUST 不再要求 `teacher_id`、`student_id`、`school_id`

#### Scenario: 学习进度接口不再要求 schoolId
- **WHEN** 客户端调用 `POST /course/sync-progress` 或 `POST /course/getLearningProgress`
- **THEN** 请求体 MUST 不再包含 `schoolId`
- **THEN** 系统 MUST 使用 ALS 中的 `schoolId` 完成权限校验与数据过滤

### Requirement: ALS 上下文字段类型必须稳定
系统 MUST 保持上下文字段类型一致，避免服务层出现角色与租户解析歧义。

#### Scenario: roleIds 类型稳定为字符串数组
- **WHEN** 服务层读取 ALS 中 `roleIds`
- **THEN** `roleIds` MUST 为 `string[]`，不得出现字符串与数组混用
