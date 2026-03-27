## ADDED Requirements

### Requirement: 小文件图片上传
系统 SHALL 提供 POST `/file/upload/image` 接口，接受 multipart/form-data 格式的图片文件，大小 SHALL 不超过 5MB，支持类型为 jpg/jpeg/png/gif/webp。上传成功后将文件写入指定磁盘目录，返回相对存储路径（data 字段）。接口需携带有效 JWT。

**请求：**
- Method: `POST`
- Path: `/file/upload/image`
- Content-Type: `multipart/form-data`
- Body: `file`: 图片文件（required）；`target`: 目标子目录标识（如 `schools/{schoolId}/avatars`）（required）
- Auth: Bearer JWT（管理端或用户端）

**响应：**
```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "path": "schools/1/avatars/abc123.png",
    "size": 204800
  }
}
```

**错误响应：**
- 413：文件超过 5MB
- 415：不支持的文件类型
- 400：未提供文件

#### Scenario: 合法图片上传成功
- **WHEN** 用户携带有效 JWT 上传一个 2MB 的 PNG 文件，target 为 `schools/1/avatars`
- **THEN** 系统返回 200，data.path 包含写入的磁盘相对路径

#### Scenario: 文件超过 5MB 被拒绝
- **WHEN** 用户上传一个 6MB 的图片文件
- **THEN** 系统返回 413 错误，msg 为"文件大小超过限制 5MB"

#### Scenario: 非图片类型被拒绝
- **WHEN** 用户上传一个 .exe 文件
- **THEN** 系统返回 415 错误，msg 为"不支持的文件类型"

#### Scenario: 未携带 JWT 被拒绝
- **WHEN** 请求头不含 Authorization
- **THEN** 系统返回 401 错误
