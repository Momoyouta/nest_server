## ADDED Requirements

### Requirement: 学生获取作业题目列表
学生 SHALL 能查看已发布（`status=1`）且在作答时间窗口内的作业题目，系统 MUST 过滤掉 `standard_answer` 和 `analysis` 字段，同时返回学生已有的草稿作答内容（若存在）。

#### Scenario: 在时间窗口内正常获取题目
- **WHEN** 学生 POST `/student/assignment/detail`，Body 含 `assignment_id`，当前时间在 `[start_time, deadline]` 内
- **THEN** 系统 SHALL 返回作业信息与题目列表（不含 `standard_answer`、`analysis`），若有草稿则包含各题 `student_answer`，HTTP 200

#### Scenario: 超出截止时间后获取题目被拒绝
- **WHEN** 当前时间 > `deadline`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业已截止，不允许作答"

#### Scenario: 作业尚未开始
- **WHEN** 当前时间 < `start_time`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业尚未开始"

---

### Requirement: 学生保存作答草稿
学生 SHALL 能在截止时间前多次保存作答草稿，草稿保存不计分，不改变提交状态。

#### Scenario: 成功保存草稿（首次）
- **WHEN** 学生 POST `/student/assignment/draft/save`，Body 含 `assignment_id` 与 `answers` 列表（含 `question_id` 与 `student_answer`）
- **THEN** 系统 SHALL 在 `assignment_submission`（若不存在则创建 `status=0`）中记录草稿，在 `assignment_answer_detail` 中 upsert 各题作答，返回 HTTP 200

#### Scenario: 多次保存草稿覆盖
- **WHEN** 学生再次 POST `/student/assignment/draft/save` 同一作业
- **THEN** 系统 SHALL 覆盖更新已有 `assignment_answer_detail` 记录

#### Scenario: 截止后保存草稿被拒绝
- **WHEN** 当前时间 > `deadline`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业已截止"

#### Scenario: 已提交后保存草稿被拒绝
- **WHEN** 学生的 `assignment_submission.status >= 1`（已提交或已批改）
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业已提交，不可修改"

---

### Requirement: 学生最终提交作业
学生 SHALL 能最终提交作业，提交后锁定作答，系统 MUST 对客观题（单选/多选/判断）自动判分。

#### Scenario: 成功提交并触发客观题自动判分
- **WHEN** 学生 POST `/student/assignment/submit`，作业在时间窗口内，`status=0`（未提交）
- **THEN** 系统 SHALL：
  1. 对每道 `type=1/2/3` 的题目，对比 `student_answer.answer` 与 `standard_answer.answer`，更新 `assignment_answer_detail.is_correct` 及 `score`
  2. 若所有题目均为客观题，则 `assignment_submission.status=2`，否则 `status=1`（待批改）
  3. 更新 `assignment_submission.total_score`（客观题得分之和）
  4. 设置 `submit_time` 为当前时间戳，返回 `Result<{submission_id}>`, HTTP 200

#### Scenario: 重复提交被拒绝
- **WHEN** 学生的 `assignment_submission.status >= 1`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"作业已提交"

---

### Requirement: 学生查看批改结果
学生 SHALL 在教师批改完成（`status=2`）后，查看所有题目的作答结果（含 `standard_answer`、`analysis`、`is_correct`、`score_earned`、`teacher_comment`）及总分。

#### Scenario: 查看批改完成的结果
- **WHEN** 学生 POST `/student/assignment/result`，Body 含 `assignment_id`，且 `status=2`
- **THEN** 系统 SHALL 返回 `submission` 基础信息及每道题的详细批改信息，HTTP 200

#### Scenario: 批改未完成时查看被拒绝
- **WHEN** `assignment_submission.status=1`（待批改）
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"成绩尚未批改完成"

---

### Requirement: 学生查看可作答的作业列表
学生 SHALL 能查看自己所属教学组已发布的作业列表，含每份作业的自己提交状态。

#### Scenario: 返回学生作业列表
- **WHEN** 学生 POST `/student/assignment/list`，Body 含 `course_id`
- **THEN** 系统 SHALL 返回该课程下自己所属 `teaching_group_id` 的所有已发布作业，每项包含 `id`、`title`、`start_time`、`deadline`、自己的 `submission_status`（null 表示未提交），HTTP 200
