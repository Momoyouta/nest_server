## ADDED Requirements

### Requirement: 客观题自动判分
系统 SHALL 在学生最终提交时，对类型为单选（1）、多选（2）、判断（3）的题目自动进行判分，判分结果写入 `assignment_answer_detail`。

#### Scenario: 单选题判分正确
- **WHEN** 学生提交，`type=1` 题目的 `student_answer.answer[0]` 与 `standard_answer.answer[0]` 一致
- **THEN** 系统 SHALL 设置该题 `is_correct=1`，`score=question.score`

#### Scenario: 单选题判分错误
- **WHEN** `student_answer.answer[0]` 与 `standard_answer.answer[0]` 不一致
- **THEN** 系统 SHALL 设置 `is_correct=0`，`score=0`

#### Scenario: 多选题全选正确
- **WHEN** `type=2` 题目的 `student_answer.answer` 排序后与 `standard_answer.answer` 排序后完全一致
- **THEN** 系统 SHALL 设置 `is_correct=1`，`score=question.score`

#### Scenario: 多选题部分正确（按全对计）
- **WHEN** `student_answer.answer` 与 `standard_answer.answer` 不完全一致
- **THEN** 系统 SHALL 设置 `is_correct=0`，`score=0`（不设部分得分）

#### Scenario: 判断题判分
- **WHEN** `type=3` 题目，`student_answer.answer[0]` 为 `"T"` 或 `"F"`，与 `standard_answer.answer[0]` 比较
- **THEN** 一致时 `is_correct=1, score=question.score`；不一致时 `is_correct=0, score=0`

#### Scenario: 主观题不参与自动判分
- **WHEN** 题目 `type=4` 或 `type=5`
- **THEN** 系统 SHALL 设置 `is_correct=null`，`score=0`，等待教师手动批改

---

### Requirement: 客观题全部完成后自动标记为已批改
若某份作业不含任何主观题（type 4/5），提交触发自动判分后系统 SHALL 自动将 `assignment_submission.status` 设为 2（已批改完成）。

#### Scenario: 纯客观题作业自动完成批改
- **WHEN** 学生提交的作业所有题目均为 type=1/2/3，且自动判分完成
- **THEN** 系统 SHALL 将 `assignment_submission.status=2`，`grade_time` 设为当前时间戳

#### Scenario: 混合题型作业等待手动批改
- **WHEN** 作业中存在 type=4 或 type=5 的题目
- **THEN** 系统 SHALL 将 `assignment_submission.status=1`（待批改），等待教师操作
