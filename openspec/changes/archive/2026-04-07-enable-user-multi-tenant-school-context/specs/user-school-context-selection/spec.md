## ADDED Requirements

### Requirement: 用户登录后必须进入选校阶段
系统 MUST 在 `POST /auth/login` 用户端登录成功时返回选校阶段数据，而不是直接返回可用业务态 token。

#### Scenario: 登录成功返回待选校令牌与学校列表
- **WHEN** 客户端调用 `POST /auth/login` 且账号密码校验通过
- **THEN** 系统 MUST 返回 `Result.data.pendingToken`（不含 schoolId）与 `Result.data.schools` 数组
- **THEN** `schools` 每项 MUST 包含 `schoolId`、`schoolName`、`actorType`、`actorId`

### Requirement: 系统必须提供选校换发业务 token 接口
系统 MUST 提供 `POST /auth/selectSchool`，并在校验通过后签发包含 `schoolId` 的用户端业务 token。

#### Scenario: 选校成功换发 token
- **WHEN** 客户端携带有效 `pendingToken` 调用 `POST /auth/selectSchool`，且请求体 `schoolId` 满足 `@IsString()` 与 `@IsNotEmpty()`
- **THEN** 系统 MUST 返回 `Result.data.token`（业务 token）
- **THEN** 新 token 的声明 MUST 包含 `userId`、`roles`、`roleIds`、`schoolId`、`actorType`、`actorId`
- **THEN** 返回的 `baseUserInfo.schoolId` MUST 等于请求中的 `schoolId`

#### Scenario: 非可选学校拒绝换发
- **WHEN** 客户端提交不属于当前用户可选学校集合的 `schoolId`
- **THEN** 系统 MUST 返回 403 业务错误，且不得签发业务 token

### Requirement: 系统必须支持用户在已加入学校间切换
系统 MUST 提供 `POST /auth/switchSchool`，允许已登录用户在授权范围内切换当前学校并刷新 token。

#### Scenario: 切校成功返回新 token
- **WHEN** 客户端携带有效业务 token 调用 `POST /auth/switchSchool`，且请求体 `schoolId` 合法
- **THEN** 系统 MUST 返回新的 `Result.data.token`
- **THEN** 新 token 的 `schoolId` MUST 为目标学校，旧 token 所在上下文不再用于后续请求

### Requirement: 待选校令牌必须限制访问范围
系统 MUST 限制 `pendingToken` 仅可访问选校相关接口，不得访问业务接口。

#### Scenario: 待选校令牌访问业务接口被拒绝
- **WHEN** 客户端使用 `pendingToken` 调用课程、文件、学习进度等业务接口
- **THEN** 系统 MUST 返回 401 或 403

#### Scenario: 待选校令牌访问选校接口成功
- **WHEN** 客户端使用 `pendingToken` 调用 `GET /auth/schools` 或 `POST /auth/selectSchool`
- **THEN** 系统 MUST 正常返回选校相关结果
