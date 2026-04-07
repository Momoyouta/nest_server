## ADDED Requirements

### Requirement: 教师创建作业草稿
教师 SHALL 能创建作业并保存为草稿状态（`status=0`），作业包含标题、描述、关联 `course_id`、`teaching_group_id`、`start_time`（开始时间戳）、`deadline`（截止时间戳），以及若干题目，题目含题型、分值、题干内容（JSON）、标准答案（JSON）、排序值 `sort_order`、可选解析 `analysis`。

#### Scenario: 教师保存草稿成功
- **WHEN** 教师 POST `/teacher/assignment/save`，携带有效的 `course_id`、`title`、题目列表（至少1题），且 `teaching_group_id` 属于该课程
- **THEN** 系统 SHALL 创建或更新 `course_assignment`（`status=0`）及 `course_assignment_question` 记录，并返回 `Result<{assignment_id}>`，HTTP 200

#### Scenario: 更新已有草稿
- **WHEN** 教师 POST `/teacher/assignment/save`，Body 包含已有 `assignment_id`（其 `status=0`）
- **THEN** 系统 SHALL 删除该作业旧的题目记录后重新插入新题目列表，更新 `course_assignment` 字段，返回 HTTP 200

#### Scenario: 草稿更新被拒绝（已发布）
- **WHEN** 教师尝试保存草稿时 `assignment_id` 对应作业 `status=1`（已发布）
- **THEN** 系统 SHALL 抛出 `BadRequestException`，msg 为"作业已发布，不允许编辑题目与答案"

---

### Requirement: 教师发布作业
教师 SHALL 能将草稿作业发布（`status=0 → status=1`），发布后题目与答案锁定；系统 MUST 验证作业存在且为草稿状态，且 `start_time` < `deadline`。

#### Scenario: 发布成功
- **WHEN** 教师 POST `/teacher/assignment/publish`，Body 含合法 `assignment_id`（status=0）且时间合法
- **THEN** 系统 SHALL 将 `course_assignment.status` 更新为 1，返回 HTTP 200

#### Scenario: 已发布作业再次发布被拒绝
- **WHEN** 教师尝试发布已是 `status=1` 的作业
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业已发布"

#### Scenario: 时间不合法被拒绝
- **WHEN** `start_time >= deadline`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"开始时间必须早于截止时间"

---

### Requirement: 教师调整作业时间
教师 SHALL 能在作业发布后调整 `start_time` 和 `deadline`，且不能将截止时间提前到过去。

#### Scenario: 时间延长成功
- **WHEN** 教师 POST `/teacher/assignment/deadline/extend`，携带 `assignment_id` 及新的 `start_time`、`deadline`（`deadline` > 当前时间）
- **THEN** 系统 SHALL 更新 `course_assignment` 时间字段，返回 HTTP 200

#### Scenario: 截止时间不合法
- **WHEN** 新 `deadline` <= 当前时间 Unix 时间戳
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"截止时间不得早于当前时间"

---

### Requirement: 教师查看作业列表
教师 SHALL 能分页查询自己课程下的作业列表，可按 `course_id` 和 `teaching_group_id` 过滤。

#### Scenario: 返回作业列表
- **WHEN** 教师 POST `/teacher/assignment/list`，Body 含 `course_id`（可选 `teaching_group_id`）
- **THEN** 系统 SHALL 返回该课程下（或该小班下）的作业列表，包含 `id`、`title`、`status`、`start_time`、`deadline`、题目总数，HTTP 200

---

### Requirement: 教师查看作业详情
教师 SHALL 能查看作业完整内容，包含题目列表及标准答案。

#### Scenario: 返回含答案的详情
- **WHEN** 教师 POST `/teacher/assignment/detail`，Body 含合法 `assignment_id`
- **THEN** 系统 SHALL 返回 `course_assignment` 信息与 `course_assignment_question` 列表（含 `standard_answer` 与 `analysis`），按 `type ASC, sort_order ASC` 排序

---

### Requirement: 五种题型支持
系统 SHALL 支持题型 `type` 枚举：1-单选，2-多选，3-判断，4-填空，5-简答，对应不同的 `content` 与 `standard_answer` JSON 结构。

#### Scenario: 单选题结构合法
- **WHEN** 创建 `type=1` 的题目，`content.options` 至少含2个选项，`standard_answer.answer` 为长度1的数组（如 `["A"]`）
- **THEN** 系统 SHALL 允许保存

#### Scenario: 多选题结构合法
- **WHEN** 创建 `type=2` 的题目，`content.options` 至少含2个选项，`standard_answer.answer` 为长度≥2的数组
- **THEN** 系统 SHALL 允许保存

#### Scenario: 判断题结构合法
- **WHEN** 创建 `type=3` 的题目，`content.options` 固定为 `[{id:"T",text:"正确"},{id:"F",text:"错误"}]`，`standard_answer.answer` 为 `["T"]` 或 `["F"]`
- **THEN** 系统 SHALL 允许保存

---

### Requirement: 同类型题目排序
题目 SHALL 在同类型（`type`）内可通过 `sort_order` 排序，且排序不跨题型。

#### Scenario: 查询时按类型和排序返回题目
- **WHEN** 查询作业详情或学生获取作业题目
- **THEN** 返回的题目列表 SHALL 按 `type ASC, sort_order ASC` 排列
