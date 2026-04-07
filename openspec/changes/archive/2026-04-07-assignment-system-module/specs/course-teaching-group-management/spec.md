## MODIFIED Requirements

### Requirement: 教学组关联扩展至作业提交维度
`assignment_submission` 表 SHALL 新增 `teaching_group_id` 字段（冗余），在学生提交作业时从 `course_assignment.teaching_group_id` 冗余记录，以支持按教学小班维度快速统计，无需关联 `course_assignment` 表即可过滤。

#### Scenario: 提交时自动冗余 teaching_group_id
- **WHEN** 学生 POST `/student/assignment/submit`，系统处理提交
- **THEN** 系统 SHALL 将对应 `course_assignment.teaching_group_id` 写入 `assignment_submission.teaching_group_id`

#### Scenario: 教师按小班过滤统计
- **WHEN** 教师调用统计接口并传入 `teaching_group_id`
- **THEN** 系统 SHALL 仅统计该 `teaching_group_id` 下的 `assignment_submission` 记录，无需 JOIN `course_assignment`
