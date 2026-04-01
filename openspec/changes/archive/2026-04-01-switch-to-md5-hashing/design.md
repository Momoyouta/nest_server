## Goals
- 在后端所有 DTO、Controller 和 Service 的注释及 Swagger 描述中，将哈希算法从 SHA-256 统一变更为 MD5。
- 确保 API 文档准确反映哈希算法的要求。

## Non-Goals
- 不修改前端 Hash 计算逻辑（已由用户决定在前端使用 `spark-md5`）。
- 不更改 API 字段名 `fileHash`（保持兼容性）。

## Decisions

### 1. DTO 更新
- `InitChunkDto`: 将 `fileHash` 的 `ApiProperty` 描述从 `文件SHA-256哈希值` 改为 `文件MD5哈希值`。
- `UploadChunkDto`: 将 `fileHash` 的 `ApiProperty` 描述从 `文件SHA-256哈希值` 改为 `文件MD5哈希值`。
- `MergeChunkDto`: 将 `fileHash` 的 `ApiProperty` 描述从 `文件SHA-256哈希值` 改为 `文件MD5哈希值`。

### 2. Controller 更新
- `FileController`: 在 `uploadChunk` 的 `ApiBody` 描述中更新哈希算法说明。
- `FileController`: 在 `getChunkProgress` 的 `ApiParam` 描述中更新哈希算法说明。

### 3. Service 注释更新
- `ChunkService`: 更新 `initUpload` 等方法的注释，明确 `fileHash` 为 MD5。

## Risks / Trade-offs
- **历史数据**: 切换算法后，之前用 SHA-256 上传但未完成的任务将无法匹配，用户需重新计算 MD5 并开启新上传任务。这是可接受的，因为系统目前处于开发阶段。
