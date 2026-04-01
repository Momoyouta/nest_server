# file-chunk-upload Specification Update

## Modified Requirements

### Requirement: refactored-file-chunk-upload
该需求的核心业务逻辑不变，但 **fileHash** 字段的算法要求从 **SHA-256** 变更为 **MD5**。

#### Scenario: 使用 MD5 哈希提交分片
- **WHEN** 用户发送 `POST /file/chunk/upload`，且 `fileHash` 为 32 位 MD5 字符串。
- **THEN** 系统能够正确识别并存储分片至 `uploads/temp/chunks/{fileHash}/` 目录。

#### Scenario: 使用 MD5 哈希合并文件
- **WHEN** 用户发送 `POST /file/chunk/merge`，且 `fileHash` 为 MD5。
- **THEN** 系统将 `uploads/temp/chunks/{fileHash}` 下的分片合并，并在业务目录下生成 `{fileHash}.ext` 文件。

#### Scenario: 进度查询匹配
- **WHEN** 用户通过 `GET /file/chunk/progress/{fileHash}` 查询进度（fileHash 为项目采用 MD5 后计算的值）。
- **THEN** 系统能够正确返回基于 MD5 索引的上传记录。
