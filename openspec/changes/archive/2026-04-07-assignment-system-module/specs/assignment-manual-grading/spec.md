## ADDED Requirements

### Requirement: 教师手动批改主观题
教师 SHALL 能对单道主观题（`type=4 填空` 或 `type=5 简答`）逐题打分，并可添加单题评语（`teacher_comment`），分值 MUST 不超过该题 `score` 上限。

#### Scenario: 成功批改单道主观题
- **WHEN** 教师 POST `/teacher/assignment/grade`，Body 含 `submission_id`、`question_id`、`score`（≤ 该题满分）、可选 `teacher_comment`
- **THEN** 系统 SHALL 更新 `assignment_answer_detail.score`、`teacher_comment`，重新计算并更新 `assignment_submission.total_score`，返回 HTTP 200

#### Scenario: 打分超出满分被拒绝
- **WHEN** `score > assignment_answer_detail → question.score`
- **THEN** 系统 SHALL 返回 `BadRequestException`，msg 为"评分不得超过题目满分"

#### Scenario: 所有主观题批改完后自动关闭批改状态
- **WHEN** 教师批改某题后，该 `submission_id` 下所有 `type=4/5` 题目的 `score` 均已被评定（由教师赋值过，> 0 或明确设为0）
- **THEN** 系统 SHALL 自动将 `assignment_submission.status=2`，`grade_time` 设为当前时间戳

#### Scenario: 整体教师评语
- **WHEN** 教师调用批改接口时可选传入 `overall_comment`（对应 `assignment_submission.teacher_comment`）
- **THEN** 系统 SHALL 更新 `assignment_submission.teacher_comment`

---

### Requirement: 教师查看学生提交列表
教师 SHALL 能按作业查看所有学生的提交情况（姓名、状态、得分），可按 `teaching_group_id` 过滤。

#### Scenario: 返回提交列表
- **WHEN** 教师 POST `/teacher/assignment/submissions`，Body 含 `assignment_id`，可选 `teaching_group_id`
- **THEN** 系统 SHALL 返回学生列表，每项含 `student_id`、学生姓名、`status`、`total_score`、`submit_time`，未提交学生也应列出（`status=null` 或 `status=0`）
