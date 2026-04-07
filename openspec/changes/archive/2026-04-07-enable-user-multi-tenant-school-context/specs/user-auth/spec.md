## MODIFIED Requirements

### Requirement: 认证成功响应必须包含基础用户信息
系统在用户端登录/注册后 MUST 返回可选学校上下文，在选校换发与 JWT 校验成功时 MUST 返回可用于业务鉴权的基础用户信息。

#### Scenario: 登录成功返回待选校上下文
- **WHEN** 客户端调用 `POST /auth/login` 且凭据校验通过
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data` 包含 `pendingToken` 与 `schools`

#### Scenario: 选校成功返回业务 token 与基础用户信息
- **WHEN** 客户端调用 `POST /auth/selectSchool` 且 `schoolId` 校验通过
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data` 包含 `token` 与 `baseUserInfo`
- **THEN** `baseUserInfo` MUST 包含 `userId`、`userRoles`、`userName`、`schoolId`

#### Scenario: JWT 校验成功返回 valid 与基础用户信息
- **WHEN** 客户端调用 `POST /auth/jwtAuth` 且 Bearer token 验证通过
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data.valid` 为 `true`
- **THEN** 当 token 为业务 token 时，`Result.data.baseUserInfo.schoolId` MUST 存在

### Requirement: baseUserInfo 字段契约必须稳定且可用于权限判断
系统返回的 `baseUserInfo` MUST 满足以下契约：`userId` 为字符串，`userRoles` 为字符串数组，`userName` 为字符串，`schoolId` 为字符串（业务 token 场景必填），且字段名在认证相关接口中保持一致。

#### Scenario: 接口间字段命名一致
- **WHEN** 客户端分别调用 `POST /auth/selectSchool`、`POST /auth/switchSchool`、`POST /auth/jwtAuth` 并获得成功响应
- **THEN** 三个接口返回中的 `baseUserInfo` MUST 使用相同字段名 `userId`、`userRoles`、`userName`、`schoolId`

#### Scenario: 角色与学校字段可直接用于前端权限判断
- **WHEN** 成功响应返回 `baseUserInfo.userRoles` 与 `baseUserInfo.schoolId`
- **THEN** 客户端 MUST 无需额外解析数据库即可完成基础角色判断与当前租户识别

### Requirement: 认证响应 DTO 必须完整声明 OpenAPI 3.0 元数据
系统 MUST 为登录、选校、切校、JWT 校验响应 DTO 及其嵌套字段添加 Swagger 装饰器，并与请求 DTO 的 class-validator 规则保持一致。

#### Scenario: Swagger 可见完整嵌套结构
- **WHEN** 开发者打开 Swagger 文档查看 `POST /auth/login`、`POST /auth/selectSchool`、`POST /auth/switchSchool`、`POST /auth/jwtAuth`
- **THEN** 文档 MUST 展示 `pendingToken`、`schools`、`token`、`baseUserInfo` 等完整字段与类型

#### Scenario: 请求体验证规则与文档一致
- **WHEN** 开发者查看 `POST /auth/selectSchool` 与 `POST /auth/switchSchool` 的请求体定义
- **THEN** `schoolId` 字段 MUST 标注为必填字符串，并与 `@IsString()`、`@IsNotEmpty()` 约束一致

## ADDED Requirements

### Requirement: 待选校 token 必须具备访问范围控制
系统 MUST 将未携带 `schoolId` 的 pending token 视为过渡态令牌，仅允许访问选校相关接口。

#### Scenario: pending token 调用业务接口被拒绝
- **WHEN** 客户端使用 pending token 调用课程、文件、学习进度等业务接口
- **THEN** 系统 MUST 返回 401 或 403，并提示先完成选校

#### Scenario: pending token 调用选校接口成功
- **WHEN** 客户端使用 pending token 调用 `GET /auth/schools` 或 `POST /auth/selectSchool`
- **THEN** 系统 MUST 正常返回可选学校列表或换发结果
