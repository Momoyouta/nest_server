## ADDED Requirements

### Requirement: 获取用户角色列表 (Query User Roles)
系统必须允许通过用户 ID 查询该用户关联的所有角色的详细信息。

#### Scenario: 成功获取角色列表
- **WHEN** 调用 `GET /user/roles/:id` 且 `id` 存在
- **THEN** 系统应返回 HTTP 200 及角色对象数组，包含 `id`, `nameEN`, `nameCN`, `level` 字段

#### Scenario: 用户不存在或无角色
- **WHEN** 调用 `GET /user/roles/:id` 且 `id` 不存在或该用户 `role_id` 字段为空
- **THEN** 系统应返回 HTTP 200 及空数组

### Requirement: 更新用户角色关联 (Update User Roles)
系统必须允许通过传入一组角色 ID 来更新指定用户的角色关联。

#### Scenario: 成功更新角色
- **WHEN** 调用 `PUT /user/roles/:id` 并提供有效的角色 ID 数组（如 `["1", "2"]`）
- **THEN** 系统应更新数据库中该用户的 `role_id` 字段为以逗号分隔的字符串（如 `"1,2"`），并返回 HTTP 200

#### Scenario: 角色 ID 验证失败
- **WHEN** 调用 `PUT /user/roles/:id` 提供非数组或无效格式的 ID
- **THEN** 系统应返回 HTTP 400 Bad Request，并指出校验错误
