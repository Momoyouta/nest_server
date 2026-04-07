## Why

当前平台缺少完整的作业管理闭环：教师无法在线创建、发布包含多种题型（单选、多选、判断、填空、简答）的作业，学生无法在线作答，系统也无法对客观题自动判分——这是在线学习平台的核心刚需。

## What Changes

- **新增教师端作业创建与发布 API**：支持保存草稿与发布两种状态，发布后题目与答案锁定不可更改；支持调整作业的开始/截止时间。
- **新增五种题目类型支持**：单选 (1)、多选 (2)、判断 (3)、填空 (4)、简答 (5)，现有实体 `course_assignment_question` 中 type 枚举从4种扩展至5种，同时补充 `analysis`（题目解析）和 `teaching_group_id` 字段。
- **新增 `start_time` 字段至 `course_assignment`**：控制学生作答时间窗口（start_time ~ deadline），作答窗口关闭后系统自动为未提交学生记0分。
- **新增 `teaching_group_id` 至 `course_assignment` 与 `assignment_submission`**：支持按教学小班发布作业及统计，提升按班级查询的性能。
- **新增 `teacher_comment` 至 `assignment_answer_detail`**：支持教师对单道主观题的精准评语。
- **新增学生端作答草稿保存与最终提交 API**：两者数据结构一致，草稿可多次覆盖，提交后触发客观题自动判分（单选、多选、判断对比标准答案）。
- **新增图片上传与 `course_question_resource` 表**：题目图片存储于 `courses/{course_id}/images/`，上传后记录到 `course_question_resource` 表管理多媒体资源。
- **新增统计查询接口**：教师可获取作业整体完成率（已批改/已提交/总人数）、各题正确率与得分率；学生可查看所有题目批改结果与总分。
- **新增手动批改接口**：简答题与填空题由教师手动打分并留下评语。

## Capabilities

### New Capabilities

- `assignment-teacher-manage`：教师端作业的创建（草稿/发布）、时间调整，以及题目的增删改、排序（同类型内排序）等管理能力。
- `assignment-student-answer`：学生端的作业查看（过滤答案）、草稿保存、最终提交，以及提交后的批改结果查看。
- `assignment-auto-grading`：客观题（单选、多选、判断）提交后的系统自动判分逻辑。
- `assignment-manual-grading`：教师对主观题（填空、简答）的手动批改与评语。
- `assignment-statistics`：教师查看作业整体统计（完成率、各题正确率/得分率）与学生成绩总览；学生查看个人批改结果。
- `assignment-question-resource`：题目配图的上传与 `course_question_resource` 资源记录管理。

### Modified Capabilities

- `course-teaching-group-management`：`assignment_submission` 新增 `teaching_group_id` 冗余字段，支持按小班统计，属于数据模型的扩展性变更。

## Goals

- 完整实现教师创建/发布/统计作业、学生作答/查看批改结果的全流程。
- 客观题自动判分，简答/填空题支持教师手工批改。
- 作答时间窗口管理，截止后自动封卷并记0分。
- 题目图片资源的轻量上传与管理（无需分片）。

## Non-goals

- 不实现跨课程/跨学校的题库（题目与作业强绑定）。
- 不实现防作弊、人脸识别等监考功能。
- 不实现大文件分片上传（图片单次上传即可）。
- 不实现题目银行/AI 自动出题。

## Impact

- **新增实体/表**：`course_question_resource`（题目多媒体资源关联）。
- **修改实体**：`CourseAssignment`（新增 `start_time`, `teaching_group_id`）、`CourseAssignmentQuestion`（新增 `analysis`, 扩展 type=5 判断题枚举）、`AssignmentSubmission`（新增 `teaching_group_id`）、`AssignmentAnswerDetail`（新增 `teacher_comment`）。
- **新增模块**：`src/modules/assignment/`（含教师端 Controller/Service、学生端 Controller/Service）。
- **新增路由**：`/teacher/assignment/*`（教师端），`/student/assignment/*`（学生端）。
- **新增 Map 文件**：`src/common/utils/assignment.map.ts` 集中管理题型枚举。
- **注册实体**：在 `src/modules/common/common/common.module.ts` 中注册新实体。
