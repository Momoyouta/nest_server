## Why

当前管理端缺少对 `file_chunk` 的统一管理能力，无法按学校与创建者进行有效检索，也无法安全地执行文件迁移与清理，导致资源库整理和数据治理效率低。

## Goals

- 提供管理端 `file_chunk` 分页条件查询，返回表字段并补充创建者姓名、学校名称。
- 支持按创建时间、更新时间、文件大小排序。
- 支持仅修改文件名。
- 支持删除记录时同步删除 `target_path` 对应真实文件。
- 支持将文件按 `schoolId + file_id` 移动到学校资源库目标目录。

## Non-goals

- 不改造分片上传、合并、断点续传流程。
- 不新增文件类型体系与权限模型。
- 不返回分片总数与已上传分片序号合集。

## What Changes

- 新增管理端文件管理接口（OpenAPI）：
  - `GET /admin/fileChunk/query`：分页条件查询（条件含 `id`、`file_hash`、`filename` 模糊、状态、`type`、创建者 `userId`、学校 `schoolId`）。
  - `PATCH /admin/fileChunk/updateFilename`：仅更新文件名。
  - `DELETE /admin/fileChunk/delete`：删除记录并删除物理文件。
  - `POST /admin/fileChunk/moveToSchool`：按类型迁移文件并更新 `target_path`。
- 迁移规则：`type=1` 移动到 `resource_library/videos`；`type=2` 移动到 `resource_library/documents`，采用 hash 命名 + 二级目录分散存储。

## Capabilities

### New Capabilities
- `admin-file-chunk-management`: 管理端对 `file_chunk` 的查询、重命名、删除与学校资源库迁移能力。

### Modified Capabilities
- 无

## Impact

- 影响模块：`src/modules/file_admin`、`src/modules/file`、文件路径映射与文件系统服务。
- 影响数据：`file_chunk` 记录与磁盘文件位置一致性。
- 影响接口：新增 4 个管理端 OpenAPI 接口及对应 Swagger 注解。
