## MODIFIED Requirements

### Requirement: 用户端资料编辑接口必须与管理员接口鉴权隔离
系统 MUST 提供用户端账号管理接口，并且这些接口 SHALL 使用用户 JWT + ALS 上下文进行鉴权，不得依赖管理员 JWT 或 AdminAuth 体系。用户端接口不得允许通过请求参数指定他人身份或跨租户身份。

#### Scenario: 用户使用有效用户 JWT 访问资料接口
- **WHEN** 已登录用户携带有效用户业务 token 调用用户端资料编辑接口
- **THEN** 系统返回成功结果并仅对当前登录用户数据生效

#### Scenario: 未登录访问资料接口
- **WHEN** 请求未携带有效用户 JWT 调用用户端资料编辑接口
- **THEN** 系统返回 401 未授权错误

#### Scenario: 请求携带他人身份参数被忽略或拒绝
- **WHEN** 客户端在用户端资料接口传入 `userId`、`teacher_id`、`student_id` 或 `school_id` 试图越权
- **THEN** 系统 MUST 以 ALS 中身份为准，并拒绝越权更新

## ADDED Requirements

### Requirement: 本人业务接口不得要求手工传递本人身份参数
系统 MUST 将用户端“本人接口”的身份参数从 API 契约中剔除，身份信息统一由 ALS 提供。

#### Scenario: 课程列表接口去除 teacher_id/student_id
- **WHEN** 客户端调用 `GET /course/listTeacherCoursesUser` 或 `GET /course/listStudentCoursesUser`
- **THEN** 请求契约 MUST 不再包含 `teacher_id`、`student_id`
- **THEN** 服务端 MUST 使用 ALS 中 `actorId` 进行查询

#### Scenario: 学习进度接口去除 schoolId
- **WHEN** 客户端调用 `POST /course/sync-progress` 或 `POST /course/getLearningProgress`
- **THEN** 请求 DTO MUST 不再要求 `schoolId`
- **THEN** 校验逻辑 MUST 使用 ALS 中 `schoolId`
