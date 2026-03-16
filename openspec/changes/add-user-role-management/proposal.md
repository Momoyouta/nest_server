## Why

当前 `user` 模块缺乏完善的角色管理接口。为了支持动态调整用户权限，需要提供查询、修改和删除用户关联角色的标准 API，以便于后台管理系统对用户权限进行精确控制。

## Goals

- 实现根据用户 ID 查询其关联的所有角色详细信息。
- 实现修改用户关联的角色（支持多角色，以逗号分隔存储在 `role_id` 字段）。
- 所有新接口均需符合 OpenAPI 3.0 标准并包含完整的 Swagger 文档。

## Non-goals

- 不涉及 `role` 表本身的增删改查（角色定义管理）。
- 不涉及前端 UI 的实现。
- 不涉及复杂的权限校验逻辑（仅关注用户与角色的关联管理）。
- 不涉及移除用户的所有角色关联功能。

## What Changes

- 在 `UserController` 中添加两个新接口：
    - `GET /user/roles/:id`: 获取指定用户的角色列表（增强现有逻辑）。
    - `PUT /user/roles/:id`: 更新指定用户的角色关联（接收角色 ID 数组）。
- 在 `UserService` 中实现对应的业务逻辑。
- 创建相应的 DTO 类并添加 Swagger 装饰器。

## Capabilities

### New Capabilities
- `user-role-management`: 提供对用户角色关联关系的查询和修改操作，并确保接口契约符合 OpenAPI 3.0。

### Modified Capabilities
- 无

## Impact

- **API**: 新增 `/user/roles/:id` 路径下的两个方法。
- **DTO**: 新增 `UpdateUserRolesDto` 用于角色更新。
- **Service**: `UserService` 将增加角色管理的业务方法。
