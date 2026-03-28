## Why

前端管理端或客户端在用户登录或进行 JWT 验证时，需要获取用户的基本信息（如用户 ID、角色、姓名）以便在 UI 上进行展示和权限判断。目前接口仅返回了 token，这导致前端需要额外解析 token 或者再次请求以获取基础信息，优化后能减少开销并方便前端处理。

## Goals
- 在 `login`、`register`、`jwtAuth` 接口响应中，与 `token` 或验证结果一同返回 `baseUserInfo`（包含 `userId`, `userRoles`, `userName`）。
- 确保相关返回类型的 DTO 带有完整的 Swagger 装饰器（符合 OpenAPI 3.0 规范）。

## Non-goals
- 不修改现有的 JWT 加解密和拦截器核心逻辑。
- 不涉及除认证模块以外的其他业务接口调整。

## What Changes

- 修改 `AuthService` 的 `login` 和 `register` 方法，在返回 `token` 时同时查找并返回 `baseUserInfo`。
- 修改 `AuthController` 中的 `jwtAuth` 接口，使其在验证通过时除了返回 `true` 外，还返回该 token 对应的 `baseUserInfo`。
- 新增或更新包含 `baseUserInfo` 的响应 DTO，并使用 `@ApiProperty` 完善 Swagger 文档。

## Capabilities

### New Capabilities

### Modified Capabilities
- `user-auth`: 扩展认证相关接口的返回值，包含基础用户信息。

## Impact

- `src/modules/auth/auth.controller.ts`: 涉及接口（`login`, `register`, `jwtAuth`）的返回值类型及 Swagger 描述更新。
- `src/modules/auth/auth.service.ts`: 涉及上述接口底层服务的数据组装。
- 依赖于上述接口的前端客户端将接收到更丰富的数据结构。
