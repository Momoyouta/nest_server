# Course Material API Specification

## Endpoints

### 1. 绑定/上传课程资料
`POST /course/material/bind` (或 `upload`)

**Request**:
```json
{
  "course_id": "string",
  "file_id": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "bound": true
}
```

### 2. 查询课程资料列表
`GET /course/material/list`

**Query Parameters**:
- `course_id`: string (必填)
- `file_name`: string (可选, 模糊匹配)
- `page`: number (默认 1)
- `pageSize`: number (默认 10)

**Response**:
```json
{
  "list": [
    {
      "id": "string",
      "file_id": "string",
      "file_name": "string",
      "uploader_id": "string",
      "uploader_name": "string",
      "create_time": "string"
    }
  ],
  "total": 100
}
```

### 3. 修改资料文件名
`POST /course/material/update`

**Request**:
```json
{
  "material_id": "string",
  "file_name": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "updated": true
}
```

### 4. 删除资料
`POST /course/material/delete`

**Request**:
```json
{
  "material_id": "string",
  "mode": 1 
}
```
*Note: mode 1 = 仅解绑, 2 = 彻底删除*

**Response**:
```json
{
  "id": "string",
  "deleted": true
}
```

## Security & Permissions

- 所有接口均需 JWT 验证。
- **管理员**: 仅限操作本校课程下的资料。
- **教师**: 必须在课程的教学组中，且课程属于本校。
