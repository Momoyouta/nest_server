## ADDED Requirements

### Requirement: 学校目录结构创建
系统 SHALL 提供 POST `/file/storage/school` 接口，根据 schoolId 在磁盘上创建学校所有标准子目录（avatars、materials、publicMaterials、courses）。若目录已存在则幂等跳过。

**请求：**
- Method: `POST`
- Path: `/file/storage/school`
- Auth: Bearer JWT（需 @Role('admin') 或 @Role('root')）
- Body: `{ "schoolId": "uuid-string" }`

**响应：**
```json
{ "code": 200, "msg": "目录创建成功", "data": { "basePath": "schools/uuid-string" } }
```

#### Scenario: 首次创建学校目录
- **WHEN** 管理员提交 schoolId=1 且对应目录不存在
- **THEN** 系统创建 `schools/1/avatars/`、`schools/1/materials/` 等全部子目录，返回 200

#### Scenario: 目录已存在幂等处理
- **WHEN** schoolId=1 的目录已存在时再次调用
- **THEN** 系统返回 200，不报错，不重复创建

#### Scenario: 无权限用户被拒绝
- **WHEN** 普通学生 JWT 调用该接口
- **THEN** 返回 403，msg 为"无权访问"

### Requirement: 课程目录结构创建
系统 SHALL 提供 POST `/file/storage/course` 接口，根据 schoolId 和 courseId 在对应学校目录下创建课程子目录（materials、chapters、homework）。

**请求：**
- Method: `POST`
- Path: `/file/storage/course`
- Auth: Bearer JWT（@Role('admin','root','school_root','school_admin')）
- Body: `{ "schoolId": "uuid-string", "courseId": "uuid-string" }`

**响应：**
```json
{ "code": 200, "msg": "目录创建成功", "data": { "basePath": "schools/uuid-string/courses/uuid-string" } }
```

#### Scenario: 创建课程目录
- **WHEN** 提交合法的 schoolId 和 courseId
- **THEN** 创建 `schools/1/courses/5/materials/`、`chapters/`、`homework/`，返回 200

### Requirement: 章节/课时目录创建
系统 SHALL 提供 POST `/file/storage/chapter-lesson` 接口，根据 schoolId、courseId、chapterId、lessonId 创建深层嵌套目录结构 `schools/{s}/courses/{c}/chapters/{ch}/lessons/{l}/`。

**请求：**
- Method: `POST`
- Path: `/file/storage/chapter-lesson`
- Auth: Bearer JWT
- Body: `{ "schoolId": "uuid-string", "courseId": "uuid-string", "chapterId": "uuid-string", "lessonId": "uuid-string" }`

**响应：**
```json
{ "code": 200, "msg": "目录创建成功", "data": { "basePath": "schools/uuid-string/courses/uuid-string/chapters/uuid-string/lessons/uuid-string" } }
```

#### Scenario: 创建课时目录
- **WHEN** 提供完整的 schoolId/courseId/chapterId/lessonId
- **THEN** 创建完整嵌套目录，返回 200

### Requirement: 作业提交目录创建
系统 SHALL 提供 POST `/file/storage/homework` 接口，根据 schoolId、courseId、homeworkId、submitId 创建作业提交目录 `schools/{s}/courses/{c}/homework/{h}/{sub}/`。

**请求：**
- Method: `POST`
- Path: `/file/storage/homework`
- Auth: Bearer JWT
- Body: `{ "schoolId": "uuid-string", "courseId": "uuid-string", "homeworkId": "uuid-string", "submitId": "uuid-string" }`

**响应：**
```json
{ "code": 200, "msg": "目录创建成功", "data": { "basePath": "schools/uuid-string/courses/uuid-string/homework/uuid-string/uuid-string" } }
```

#### Scenario: 创建作业提交目录
- **WHEN** 提供完整的 schoolId/courseId/homeworkId/submitId
- **THEN** 创建对应目录，返回 200
