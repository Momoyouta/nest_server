## ADDED Requirements

### Requirement: 分片上传初始化
系统 SHALL 提供 POST `/file/chunk/init` 接口，客户端在上传大文件前调用，提交文件的 SHA-256 hash、文件名、总大小和分片总数。系统 SHALL 在 MySQL `file_chunk` 表中创建一条记录（status: pending），并返回 uploadId。若同一 fileHash 已存在 pending/merging 状态记录，SHALL 直接返回已有 uploadId（断点续传支持）。

**请求：**
- Method: `POST`
- Path: `/file/chunk/init`
- Auth: Bearer JWT
- Body:
  ```json
  {
    "fileHash": "sha256hex",
    "fileName": "lecture01.mp4",
    "fileSize": 524288000,
    "totalChunks": 50
  }
  ```

**响应：**
```json
{
  "code": 200,
  "msg": "初始化成功",
  "data": {
    "uploadId": "uuid",
    "fileHash": "sha256hex",
    "uploadedChunks": [0, 1, 2]
  }
}
```

#### Scenario: 全新文件初始化
- **WHEN** 客户端提交一个未曾上传过的文件 hash
- **THEN** 系统在 DB 创建新记录，返回新 uploadId，uploadedChunks 为空数组

#### Scenario: 断点续传恢复
- **WHEN** 客户端提交一个已存在 pending 状态记录的 fileHash
- **THEN** 系统返回已有 uploadId，uploadedChunks 包含已上传的分片索引列表

### Requirement: 单分片上传
系统 SHALL 提供 POST `/file/chunk/upload` 接口，接受单个分片文件（multipart/form-data）。每个分片 SHALL 携带 uploadId、chunkIndex。系统将分片写入 `uploads/temp/chunks/{fileHash}/` 目录，并更新 DB 记录的已上传分片列表。

**请求：**
- Method: `POST`
- Path: `/file/chunk/upload`
- Auth: Bearer JWT
- Content-Type: `multipart/form-data`
- Body: `file`（二进制分片）；`uploadId`（string）；`chunkIndex`（number）

**响应：**
```json
{
  "code": 200,
  "msg": "分片上传成功",
  "data": { "chunkIndex": 3, "uploadedChunks": [0, 1, 2, 3] }
}
```

#### Scenario: 合法分片上传
- **WHEN** 客户端上传第 5 个分片（chunkIndex=4）并提供有效 uploadId
- **THEN** 分片文件写入磁盘，DB 记录更新，返回已上传分片列表

#### Scenario: 重复上传同一分片
- **WHEN** 客户端再次上传已存在的分片（chunkIndex=2）
- **THEN** 系统幂等处理，覆盖写入，返回 200

#### Scenario: uploadId 不存在
- **WHEN** 提交的 uploadId 在 DB 中不存在
- **THEN** 返回 404 错误，msg 为"上传任务不存在"

### Requirement: 查询分片上传进度
系统 SHALL 提供 GET `/file/chunk/progress/:fileHash` 接口，返回该文件当前已上传的分片索引列表和任务状态。

**请求：**
- Method: `GET`
- Path: `/file/chunk/progress/:fileHash`
- Auth: Bearer JWT

**响应：**
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "uploadId": "uuid",
    "status": "pending",
    "uploadedChunks": [0, 1, 2, 3],
    "totalChunks": 50
  }
}
```

#### Scenario: 查询已有任务进度
- **WHEN** 客户端查询一个存在 pending 记录的 fileHash
- **THEN** 返回 uploadId、已上传分片数组和总分片数

#### Scenario: 查询不存在的 fileHash
- **WHEN** fileHash 在 DB 中无对应记录
- **THEN** 返回 404，msg 为"未找到上传任务"

### Requirement: 合并分片
系统 SHALL 提供 POST `/file/chunk/merge` 接口，客户端在所有分片上传完成后调用。系统 SHALL 校验已上传分片数量是否等于 totalChunks，按 chunkIndex 顺序合并文件写入目标路径，并将 DB 记录状态更新为 done，最后删除临时分片目录。

**请求：**
- Method: `POST`
- Path: `/file/chunk/merge`
- Auth: Bearer JWT
- Body:
  ```json
  {
    "uploadId": "uuid-string",
    "fileHash": "sha256hex",
    "targetPath": "schools/uuid-string/courses/uuid-string"
  }
  ```

**响应：**
```json
{
  "code": 200,
  "msg": "合并成功",
  "data": { "filePath": "schools/uuid-string/courses/uuid-string/abc123.mp4" }
}
```

#### Scenario: 所有分片完整时合并成功
- **WHEN** 所有 50 个分片均已上传，调用 merge
- **THEN** 系统按序合并文件，写入 targetPath，删除临时分片，返回最终文件路径

#### Scenario: 分片不完整时拒绝合并
- **WHEN** 只上传了 48/50 个分片时调用 merge
- **THEN** 返回 400，msg 为"分片未全部上传，已上传 48/50"

#### Scenario: 合并操作幂等性
- **WHEN** 对已 done 状态的 uploadId 再次调用 merge
- **THEN** 返回 200 并返回已有文件路径，不重复合并
