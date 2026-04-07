## ADDED Requirements

### Requirement: 题目图片上传
教师 SHALL 能为题目上传图片（非分片，单次上传），图片 MUST 存储到 `fileStore/schools/{school_id}/courses/{course_id}/images/` 路径，上传成功后系统 SHALL 在 `course_question_resource` 表中记录关联信息并返回图片相对路径。

#### Scenario: 成功上传题目题干图片
- **WHEN** 教师 POST `/assignment/question/image/upload`，`multipart/form-data` 含 `file`（图片文件）、`question_id`、`course_id`、`resource_type=1`（题干图片）
- **THEN** 系统 SHALL 将文件写入正确路径，在 `course_question_resource` 表插入一条记录（`question_id`、`resource_type`、`file_url`、`create_time`），返回 `Result<{resource_id, file_url}>`，HTTP 200

#### Scenario: 成功上传题目解析图片
- **WHEN** 教师 POST 同接口，`resource_type=2`（解析图片）
- **THEN** 系统 SHALL 同样写入文件并创建 `course_question_resource` 记录，`resource_type=2`

#### Scenario: 非图片文件被拒绝
- **WHEN** 上传的文件 MIME 类型不为 `image/*`（如 PDF、视频）
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"仅允许上传图片文件"

#### Scenario: 关联题目不存在被拒绝
- **WHEN** `question_id` 对应题目不存在于 `course_assignment_question` 表
- **THEN** 系统 SHALL 返回 `NotFoundException`，msg 为"题目不存在"

---

### Requirement: 查询题目资源列表
系统 SHALL 支持按 `question_id` 查询该题目关联的所有图片资源，供前端展示。

#### Scenario: 返回题目资源列表
- **WHEN** 查询 `question_id` 对应的资源
- **THEN** 系统 SHALL 返回 `CourseQuestionResource[]`，含 `id`、`resource_type`、`file_url`、`create_time`
