## 1. DTO 与返回契约

- [x] 1.1 新增或调整认证响应 DTO，定义 `baseUserInfo`（`userId`, `userRoles`, `userName`）并在登录、注册、JWT 校验响应中复用。
- [x] 1.2 为所有新增/修改响应字段补充 `@ApiProperty`（含类型与示例），确保 OpenAPI 3.0 文档完整。

## 2. Service 层改造

- [x] 2.1 修改 `AuthService.login`，在返回 token 时组装并返回 `baseUserInfo`。
- [x] 2.2 修改 `AuthService.register`，在返回 token 时组装并返回 `baseUserInfo`。
- [x] 2.3 为 `jwtAuth` 对应流程补充基础用户信息组装逻辑，保证 `valid=true` 时返回 `baseUserInfo`。

## 3. Controller 与接口文档

- [x] 3.1 更新 `AuthController` 的 `login`、`register` 接口返回类型与 Swagger 响应声明。
- [x] 3.2 更新 `AuthController.jwtAuth` 的返回类型与 Swagger 响应声明，明确 `valid` 与 `baseUserInfo`。
- [x] 3.3 核对 `@Public()` 与 Bearer 鉴权语义不变（`login/register` 公开，`jwtAuth` 需鉴权）。
