## ADDED Requirements

### Requirement: 教师获取作业全量统计数据
教师 SHALL 能通过单个接口获取作业的整体完成情况与各题分析数据，系统 MUST 返回：已批改人数、已提交人数、课程总人数（该 `teaching_group_id` 下的学生总数），以及每道题的正确率（`correct_rate`）和得分率（`score_rate`）。

#### Scenario: 整体提交率统计正确
- **WHEN** 教师 POST `/teacher/assignment/statistics`，Body 含 `assignment_id`，可选 `teaching_group_id`
- **THEN** 系统 SHALL 返回：
  - `total_students`：教学组总学生数
  - `submitted_count`：已提交数（status ≥ 1）
  - `graded_count`：已批改完成数（status = 2）
  - `questions`：各题统计列表（见下方场景）

#### Scenario: 各题正确率与得分率
- **WHEN** 统计接口被调用，某道题（如 `q_001`）有 30 份提交
- **THEN** 系统 SHALL 返回该题：
  - `correct_rate` = 答对人数 / 已提交该题作答人数（客观题）；主观题此值为 null
  - `score_rate` = 该题总得分 / (该题满分 × 已提交人数)

#### Scenario: 截止后自动为未提交学生补零分记录
- **WHEN** 统计接口被调用，当前时间 > `deadline`，且课程中有学生无 `assignment_submission` 记录
- **THEN** 系统 SHALL 惰性为这些学生创建 `status=0, total_score=0` 的提交记录（使用 INSERT IGNORE 防重复）

---

### Requirement: 学生查看个人成绩情况
学生 SHALL 能查看自己的得分、总分及每题批改详情（批改完成后）。

#### Scenario: 学生查看个人批改结果详情
- **WHEN** 学生 POST `/student/assignment/result`，Body 含 `assignment_id`，对应 `submission.status=2`
- **THEN** 系统 SHALL 返回 `total_score`、`teacher_comment` 及每道题的 `score_earned`、`is_correct`（客观题）、`teacher_comment`（主观题）、`standard_answer`、`analysis`

---

### Requirement: 教师查看课程整体成绩总览
教师 SHALL 能通过统计接口获取每位学生的作业得分分布，便于教学分析。

#### Scenario: 成绩分布数据返回
- **WHEN** 教师调用统计接口
- **THEN** `questions` 列表中每题包含 `score_distribution`：按得分范围（0分、低分段、高分段、满分）分组的学生人数
