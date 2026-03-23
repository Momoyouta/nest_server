# 规格：API

## 邀请码管理 API
- **URL**: `POST /admin/invite` (创建)
- **URL**: `GET /admin/invite` (列表查询)
- **URL**: `DELETE /admin/invite/:code` (删除)

### 创建
- **请求体**:
  ```json
  {
    "type": 0,
    "school_id": "uuid",
    "grade": "2024",
    "class_id": "uuid",
    "ttl": 3600
  }
  ```
- **响应**: `{ "code": "A1b2C3d4" }`

### 分页查询
- **过滤条件**: `code`, `creater_id`, `school_id`, `class_id`, `grade`, `type`
- **响应结果项**:
  ```json
  {
    "code": "A1b2C3d4",
    "type": 0,
    "school_id": "...",
    "school_name": "实验小学",
    "grade": "2024",
    "class_id": "...",
    "creater_id": "...",
    "creator_name": "张管理员",
    "create_time": "...",
    "ttl": "3600"
  }
  ```

## 注册 API 更新
- **URL**: `POST /auth/register`
- **请求体**:
  ```json
  {
    "username": "...",
    "password": "...",
    "inviteCode": "A1b2C3d4",
    "role": "teacher" 或 "student"
  }
  ```
- **验证**:
  - 该接口只允许注册 teacher 或 student
  - `inviteCode` 是强制性的。
  - 邀请码必须存在于数据库中，并且与请求的角色类型匹配。
    - `role === 'teacher'` 要求 `type === 0`。
    - `role === 'student'` 要求 `type === 1`。
