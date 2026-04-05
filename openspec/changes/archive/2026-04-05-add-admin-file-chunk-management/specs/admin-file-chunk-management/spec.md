## ADDED Requirements

### Requirement: 管理端可分页条件查询 file_chunk 并返回扩展信息
系统 MUST 提供 `GET /admin/fileChunk/query` 管理端接口，使用 JWT 管理端鉴权（`@AdminAuth()`）与角色控制（`@Role(root, admin, school_root, school_admin)`），支持分页、条件过滤与排序。

查询参数 MUST 满足以下约束：
- `page`：可选，整数，`>=1`，默认 `1`
- `pageSize`：可选，整数，`>=1` 且 `<=100`，默认 `10`
- `id`：可选，字符串
- `fileHash`：可选，字符串
- `filename`：可选，字符串，按 `file_name LIKE %filename%` 模糊匹配
- `status`：可选，枚举 `pending|merging|done|expired`
- `type`：可选，枚举 `1|2`
- `creatorId`：可选，字符串
- `schoolId`：可选，字符串
- `sortBy`：可选，枚举 `createTime|updateTime|fileSize`，默认 `updateTime`
- `sortOrder`：可选，枚举 `ASC|DESC`，默认 `DESC`

响应项 MUST 返回 `file_chunk` 主要字段，并额外返回 `creatorName` 与 `schoolName`；同时 MUST NOT 返回 `totalChunks` 与 `uploadedChunks`。

当调用角色为 `school_root` 或 `school_admin` 时，系统 MUST 将查询范围限制在“当前管理员所属学校”；即使请求中传入其他 `schoolId` 也 MUST 被忽略或覆盖。

#### Scenario: 按条件分页查询成功
- **WHEN** 管理员调用 `GET /admin/fileChunk/query?page=1&pageSize=10&schoolId=1001&status=done&sortBy=updateTime&sortOrder=DESC`
- **THEN** 系统 MUST 返回 `Result<{ items, total }>`，且 `items` 中每条记录包含 `creatorName`、`schoolName`，不包含 `totalChunks`、`uploadedChunks`

#### Scenario: 文件名模糊查询与文件大小排序成功
- **WHEN** 管理员调用 `GET /admin/fileChunk/query?filename=数学&sortBy=fileSize&sortOrder=ASC`
- **THEN** 系统 MUST 使用模糊匹配过滤 `file_name`，并按 `file_size` 升序返回分页结果

#### Scenario: 非法排序字段被拒绝
- **WHEN** 管理员调用 `GET /admin/fileChunk/query?sortBy=targetPath`
- **THEN** 系统 MUST 返回 400 参数校验错误，且不执行查询

#### Scenario: 学校管理员查询被限制为所属学校
- **WHEN** `school_admin` 调用 `GET /admin/fileChunk/query?schoolId=other-school-id`
- **THEN** 系统 MUST 仅返回其所属学校的数据，且 MUST NOT 返回其他学校记录

### Requirement: 学校管理员仅可操作所属学校数据
系统 MUST 对 `school_root` 与 `school_admin` 角色启用学校级数据范围限制；对写操作（更新文件名、删除、迁移）在执行前 MUST 校验目标记录 `school_id` 属于当前管理员。

`root` 与 `admin` 角色 MAY 跨学校操作。

#### Scenario: 学校管理员尝试跨校更新被拒绝
- **WHEN** `school_admin` 调用 `PATCH /admin/fileChunk/updateFilename` 操作非所属学校记录
- **THEN** 系统 MUST 返回 403 Forbidden

#### Scenario: 学校管理员尝试跨校删除被拒绝
- **WHEN** `school_admin` 调用 `DELETE /admin/fileChunk/delete` 操作非所属学校记录
- **THEN** 系统 MUST 返回 403 Forbidden

#### Scenario: 平台管理员可跨校迁移
- **WHEN** `root` 或 `admin` 调用 `POST /admin/fileChunk/moveToSchool` 迁移任意学校记录
- **THEN** 系统 MUST 允许执行（满足其他业务前置条件时）

### Requirement: 管理端仅可更新 file_chunk 文件名
系统 MUST 提供 `PATCH /admin/fileChunk/updateFilename` 接口，仅允许更新 `file_name` 字段，并同步更新 `update_time`。

请求体 MUST 满足以下约束：
- `id`：必填，字符串
- `fileName`：必填，字符串，`trim` 后长度 `1~255`

#### Scenario: 更新文件名成功
- **WHEN** 管理员调用 `PATCH /admin/fileChunk/updateFilename`，传入有效 `id` 与 `fileName`
- **THEN** 系统 MUST 仅更新该记录的 `file_name` 与 `update_time`，并返回更新后的记录

#### Scenario: 记录不存在
- **WHEN** 管理员传入不存在的 `id`
- **THEN** 系统 MUST 返回 404 NotFound

#### Scenario: fileName 为空字符串
- **WHEN** 管理员提交 `fileName="   "`
- **THEN** 系统 MUST 返回 400 参数校验错误

### Requirement: 管理端删除 file_chunk 时必须同步删除真实文件
系统 MUST 提供 `DELETE /admin/fileChunk/delete` 接口，接收 `id`，并支持可选参数 `force`（默认 `false`）。

删除行为 MUST 满足：
- 当 `force=false` 时执行“先删除真实文件，再删除数据库记录”。
- 当 `force=true` 时允许强制清理记录：若物理文件缺失或删除失败，系统仍 MUST 删除数据库记录。

系统 MUST 根据记录计算待删文件路径（基于 `target_path + file_hash + 扩展名`）并删除磁盘文件；在 `force=false` 下仅当物理文件删除成功后，才可删除 `file_chunk` 表记录。

#### Scenario: 删除记录与物理文件成功
- **WHEN** 管理员调用 `DELETE /admin/fileChunk/delete?id=<valid-id>`，且文件存在可删除
- **THEN** 系统 MUST 删除物理文件并删除对应 `file_chunk` 记录，返回成功响应

#### Scenario: 物理文件删除失败
- **WHEN** 管理员调用删除接口且 `force=false`，但目标文件不可删除（路径非法或 I/O 失败）
- **THEN** 系统 MUST 返回错误，且 MUST 保留数据库记录不删除

#### Scenario: 强制清理记录
- **WHEN** 管理员调用 `DELETE /admin/fileChunk/delete?id=<valid-id>&force=true`，且目标文件不存在或删除失败
- **THEN** 系统 MUST 继续删除 `file_chunk` 记录并返回成功响应

#### Scenario: 删除目标不存在
- **WHEN** 管理员传入不存在的 `id`
- **THEN** 系统 MUST 返回 404 NotFound

### Requirement: 管理端可将文件迁移到学校资源库目录
系统 MUST 提供 `POST /admin/fileChunk/moveToSchool` 接口，接收 `fileId` 与 `schoolId`，基于已有 `file_chunk` 记录执行迁移，MUST NOT 新增 `file_chunk` 记录。

系统 MUST 仅允许 `status=done` 的记录执行迁移。

请求体 MUST 满足以下约束：
- `fileId`：必填，字符串
- `schoolId`：必填，字符串

迁移规则 MUST 如下：
- 当 `type=1` 时，迁移到 `schools/{schoolId}/resource_library/videos/{dir1}/{dir2}/{fileHash}.{ext}`
- 当 `type=2` 时，迁移到 `schools/{schoolId}/resource_library/documents/{dir1}/{dir2}/{fileHash}.{ext}`
- 其中 `dir1=fileHash` 前 2 位，`dir2=fileHash` 第 3~4 位

迁移成功后，系统 MUST 更新 `target_path`（目录路径）、`school_id`、`update_time`。

#### Scenario: type=1 视频迁移成功
- **WHEN** 管理员提交有效 `fileId`、`schoolId`，且该记录 `type=1` 且源文件存在
- **THEN** 系统 MUST 将文件移动到目标学校 `resource_library/videos` 二级目录，并更新记录字段

#### Scenario: type=2 文档迁移成功
- **WHEN** 管理员提交有效 `fileId`、`schoolId`，且该记录 `type=2` 且源文件存在
- **THEN** 系统 MUST 将文件移动到目标学校 `resource_library/documents` 二级目录，并更新记录字段

#### Scenario: 不支持的 type 被拒绝
- **WHEN** 记录 `type` 不为 `1` 或 `2`
- **THEN** 系统 MUST 返回 400 BadRequest，且不移动文件、不更新记录

#### Scenario: 源文件不存在
- **WHEN** 记录存在但源文件不存在
- **THEN** 系统 MUST 返回错误并保持数据库记录不变

#### Scenario: 状态非 done 时禁止迁移
- **WHEN** 管理员迁移 `status` 为 `pending`、`merging` 或 `expired` 的记录
- **THEN** 系统 MUST 返回 400 BadRequest，且不移动文件、不更新记录
