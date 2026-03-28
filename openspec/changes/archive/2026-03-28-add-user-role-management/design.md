## Context

目前 `User` 实体通过 `role_id` 字段（逗号分隔的字符串）存储角色关联。`UserService` 已经有一个初步的 `getUserRole` 方法，但 `UserController` 缺乏标准化的 API 路由和完整的 OpenAPI 3.0 文档。

## Goals / Non-Goals

**Goals:**
- 提供 `GET /user/roles/:id` 以返回角色的完整详细信息。
- 提供 `PUT /user/roles/:id` 以允许通过 ID 数组更新用户的 `role_id`。
- 确保所有接口在 Swagger UI 中正确显示，具有明确的 DTO 和验证规则。

**Non-Goals:**
- 修改 `User` 实体的底层存储逻辑（继续沿用 CSV 字符串存储方式）。
- 实现删除接口（用户明确表示不需要）。

## Decisions

### 1. 使用 DTO 进行请求验证和文档化
- **决策**: 为 `PUT` 接口创建 `UpdateUserRolesDto`。
- **原因**: 
  - 使用 `class-validator` 确保 `roleIds` 是一个字符串数组。
  - 使用 `@ApiProperty` 装饰器自动生成 OpenAPI 3.0 文档。
  - 维持 NestJS 的标准开发模式。

### 2. API 路径设计
- **决策**: 使用 `/user/roles/:id`。
- **原因**: 符合 RESTful 风格，清晰表达资源（Role）属于特定用户。

### 3. 数据处理逻辑
- **决策**: 在 `UserService` 中处理数组与逗号分隔字符串的转换。
- **原因**: 保持业务逻辑集中，Controller 仅负责请求分发。

## OpenAPI 3.0 Specifications

### GET /user/roles/{id}
- **Summary**: 获取用户角色列表
- **Parameters**: `id` (path)
- **Response**: `200 OK` - `Role[]` (数组)

### PUT /user/roles/{id}
- **Summary**: 更新用户角色关联
- **Parameters**: `id` (path)
- **Request Body**:
  ```json
  {
    "roleIds": ["string"]
  }
  ```
- **Response**: `200 OK` - `{ code: 200, message: "更新成功" }`

## Risks / Trade-offs

- **[Risk]** `role_id` 存储为字符串可能导致数据一致性问题（如角色被删除但 User 表中仍存有 ID）。
  - **Mitigation** 鈫 本次变更不涉及 Role 表增删，未来建议改为多对多关联表。
- **[Trade-off]** 沿用逗号分隔字符串存储而非关联表。
  - **理由** 鈫 最小化对现有数据库架构的破坏，满足当前快速开发需求。
