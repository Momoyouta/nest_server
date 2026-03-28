## 1. DTO & Schema 准备

- [x] 1.1 创建 `src/modules/user/dto/UpdateUserRolesDto.dto.ts`，并添加 `@ApiProperty` 装饰器用于 OpenAPI 3.0。
- [x] 1.2 在 DTO 中添加 `class-validator` 校验规则（如 `IsArray`, `IsString`）。

## 2. Service 层逻辑实现

- [x] 2.1 在 `UserService` 中实现 `getUserRolesDetails(userId: string)` 方法，支持将 CSV 字符串转换为角色实体列表。
- [x] 2.2 在 `UserService` 中实现 `updateUserRoles(userId: string, roleIds: string[])` 方法，实现数组到 CSV 字符串的持久化转换。

## 3. Controller 层与 Swagger 集成

- [x] 3.1 在 `UserController` 中新增 `GET /user/roles/:id` 路由，并使用 `@ApiOperation`, `@ApiResponse`, `@ApiTags` 进行文档标注。
- [x] 3.2 在 `UserController` 中新增 `PUT /user/roles/:id` 路由，并关联 `UpdateUserRolesDto`，添加相应的 Swagger 装饰器。
- [x] 3.3 检查并更新现有的 `getUserRole` 逻辑以确保一致性（或将其重构为新的标准接口）。

## 4. 验证与清理

- [x] 4.1 运行项目并访问 `/api` 确认 Swagger 文档已正确更新。
- [x] 4.2 使用 Postman 或 Swagger UI 手动测试查询和修改角色的功能。
- [x] 4.3 确保代码符合 ESLint/Prettier 规范。
