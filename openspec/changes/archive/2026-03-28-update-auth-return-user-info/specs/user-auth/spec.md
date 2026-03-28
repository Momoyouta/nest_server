## ADDED Requirements

### Requirement: 认证成功响应必须包含基础用户信息
系统在登录、注册与 JWT 校验成功时，MUST 在 `Result.data` 中返回 `baseUserInfo`，并包含 `userId`、`userRoles`、`userName` 三个字段。

#### Scenario: 登录成功返回 token 与基础用户信息
- **WHEN** 客户端调用 `POST /auth/login` 且凭据校验通过
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data` 包含 `token` 与 `baseUserInfo`

#### Scenario: 注册成功返回 token 与基础用户信息
- **WHEN** 客户端调用 `POST /auth/register` 且注册流程成功
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data` 包含 `token` 与 `baseUserInfo`

#### Scenario: JWT 校验成功返回 valid 与基础用户信息
- **WHEN** 客户端调用 `GET /auth/jwtAuth` 且 Bearer token 验证通过
- **THEN** 系统 MUST 返回 HTTP 200，且 `Result.data.valid` 为 `true` 并包含 `baseUserInfo`

### Requirement: baseUserInfo 字段契约必须稳定且可用于权限判断
系统返回的 `baseUserInfo` MUST 满足以下契约：`userId` 为字符串，`userRoles` 为字符串数组，`userName` 为字符串，且字段名在三个认证接口中保持一致。

#### Scenario: 接口间字段命名一致
- **WHEN** 客户端分别调用 `POST /auth/login`、`POST /auth/register`、`GET /auth/jwtAuth` 并获得成功响应
- **THEN** 三个接口返回中的 `baseUserInfo` MUST 使用相同字段名 `userId`、`userRoles`、`userName`

#### Scenario: 角色字段可直接用于前端权限判断
- **WHEN** 成功响应返回 `baseUserInfo.userRoles`
- **THEN** 系统 MUST 提供字符串数组格式，客户端无需再次解析 token 即可执行基础角色判断

### Requirement: 认证响应 DTO 必须完整声明 OpenAPI 3.0 元数据
系统 MUST 为登录、注册、JWT 校验响应 DTO 及其嵌套字段添加 Swagger 装饰器，以在 OpenAPI 3.0 文档中准确展示结构与类型。

#### Scenario: Swagger 可见完整嵌套结构
- **WHEN** 开发者打开 Swagger 文档查看上述三个接口的 200 响应模型
- **THEN** 文档 MUST 展示 `Result.data` 下的 `token` 或 `valid` 以及 `baseUserInfo` 的完整字段和类型

#### Scenario: 响应结构与实现一致
- **WHEN** 开发者根据 Swagger 文档调用接口并比对实际响应
- **THEN** 实际 JSON 字段 MUST 与文档声明一致，不得出现缺失字段或类型不匹配