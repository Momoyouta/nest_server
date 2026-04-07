## 1. 数据库与实体准备

- [ ] 1.1 执行 SQL 创建 `course_question_resource` 表（含 `idx_question_id` 索引）
- [ ] 1.2 修改 `CourseAssignment` 实体：新增 `start_time varchar(255)`、`teaching_group_id varchar(255)` 字段及 Swagger `@ApiProperty` 注解
- [ ] 1.3 修改 `CourseAssignmentQuestion` 实体：新增 `analysis json nullable` 字段；更新题型枚举说明（type: 1-单选, 2-多选, 3-判断, 4-填空, 5-简答）
- [ ] 1.4 修改 `AssignmentSubmission` 实体：新增 `teaching_group_id varchar(255) nullable` 字段
- [ ] 1.5 修改 `AssignmentAnswerDetail` 实体：新增 `teacher_comment text nullable` 字段
- [ ] 1.6 新建 `CourseQuestionResource` 实体类（`src/database/entities/course_question_resource.entity.ts`），含 `@ApiProperty` 注解

## 2. 枚举 Map 文件

- [ ] 2.1 在 `src/common/utils/course.map.ts` 中更新 `CourseAssignmentQuestionTypeMap`，补全 type=3(判断)、type=4(填空)、type=5(简答) 枚举值及对应 `Values` 数组
- [ ] 2.2 新建 `src/common/utils/assignment.map.ts`，集中定义 `QuestionResourceTypeMap`（1-题干图片, 2-解析图片）

## 3. 实体注册与模块搭建

- [ ] 3.1 在 `src/modules/common/common/common.module.ts` 的 `entities` 常量数组中注册 `CourseQuestionResource` 实体
- [ ] 3.2 新建 `src/modules/assignment/` 目录结构：`assignment.module.ts`、`assignment.service.ts`、`teacher/teacher-assignment.controller.ts`、`student/student-assignment.controller.ts`
- [ ] 3.3 在 `src/app.module.ts` 中引入 `AssignmentModule`

## 4. DTO 定义（教师端）

- [ ] 4.1 新建 `dto/save-assignment.dto.ts`：含 `assignment_id?`、`course_id`、`teaching_group_id`、`title`、`description?`、`start_time`、`deadline`、题目列表（`QuestionItemDto`：`question_id?`、`type`、`score`、`content`、`standard_answer`、`sort_order`、`analysis?`）及 Swagger 注解
- [ ] 4.2 新建 `dto/publish-assignment.dto.ts`：含 `assignment_id`
- [ ] 4.3 新建 `dto/extend-deadline.dto.ts`：含 `assignment_id`、`start_time`、`deadline`
- [ ] 4.4 新建 `dto/assignment-list.dto.ts`：含 `course_id`、可选 `teaching_group_id`
- [ ] 4.5 新建 `dto/assignment-detail.dto.ts`：含 `assignment_id`
- [ ] 4.6 新建 `dto/grade-question.dto.ts`：含 `submission_id`、`question_id`、`score`、`teacher_comment?`、`overall_comment?`
- [ ] 4.7 新建 `dto/assignment-statistics.dto.ts`：含 `assignment_id`、可选 `teaching_group_id`
- [ ] 4.8 新建 `dto/assignment-submissions.dto.ts`：含 `assignment_id`、可选 `teaching_group_id`

## 5. DTO 定义（学生端）

- [ ] 5.1 新建 `dto/student-assignment-detail.dto.ts`：含 `assignment_id`
- [ ] 5.2 新建 `dto/save-draft.dto.ts`：含 `assignment_id`、`answers`（`AnswerItemDto[]`：`question_id`、`student_answer`）
- [ ] 5.3 新建 `dto/submit-assignment.dto.ts`：结构同 `save-draft.dto.ts`（共用或继承）
- [ ] 5.4 新建 `dto/submission-result.dto.ts`：含 `assignment_id`
- [ ] 5.5 新建 `dto/student-assignment-list.dto.ts`：含 `course_id`

## 6. AssignmentService 核心逻辑

- [ ] 6.1 实现 `saveAssignment(dto, teacherId)`：创建/更新草稿逻辑（检查 status=0 才允许更新；删旧题目重新插入）
- [ ] 6.2 实现 `publishAssignment(dto, teacherId)`：发布逻辑（校验时间合法性、status 校验）
- [ ] 6.3 实现 `extendDeadline(dto, teacherId)`：时间调整逻辑（校验 deadline > now）
- [ ] 6.4 实现 `getAssignmentList(dto, teacherId)`：教师查询作业列表
- [ ] 6.5 实现 `getAssignmentDetail(dto, teacherId)`：教师查看作业详情（含答案）
- [ ] 6.6 实现 `getStatistics(dto)`：统计接口核心逻辑（提交率 + 各题正确率/得分率 + 惰性补零分）
- [ ] 6.7 实现 `getSubmissions(dto)`：教师查看学生提交列表（含未提交学生）
- [ ] 6.8 实现 `gradeQuestion(dto)`：手动批改单题（校验分值上限、更新 total_score、自动更新 status=2 当所有主观题批改完毕）

## 7. AssignmentService 学生端逻辑

- [ ] 7.1 实现 `getStudentAssignmentList(dto, studentId)`：学生查看作业列表（按 teaching_group_id 过滤）
- [ ] 7.2 实现 `getStudentAssignmentDetail(dto, studentId)`：获取题目（过滤答案/解析，校验时间窗口，带草稿）
- [ ] 7.3 实现 `saveDraft(dto, studentId)`：保存草稿（upsert submission + upsert answer_detail，校验时间窗口和提交状态）
- [ ] 7.4 实现 `submitAssignment(dto, studentId)`：最终提交（校验时间窗口 + 状态，触发自动判分，记录 teaching_group_id 冗余，计算 total_score，更新 status）
- [ ] 7.5 实现 `autoGrade(submissionId, questions, answers)`：客观题自动判分私有方法（单选/判断/多选判断逻辑）
- [ ] 7.6 实现 `getSubmissionResult(dto, studentId)`：学生查看批改结果（校验 status=2）

## 8. 控制器实现（教师端）

- [ ] 8.1 实现 `TeacherAssignmentController`，`@ApiTags('教师端-作业管理')`，路由前缀 `/teacher/assignment`，加 `@Role('teacher')` 与 `@UseAdminAuth()` 装饰器
- [ ] 8.2 添加路由 `POST /save`（`@ApiOperation`：保存草稿）并注入 JWT 用户信息获取 `teacher_id`
- [ ] 8.3 添加路由 `POST /publish`（`@ApiOperation`：发布作业）
- [ ] 8.4 添加路由 `POST /deadline/extend`（`@ApiOperation`：调整时间）
- [ ] 8.5 添加路由 `POST /list`（`@ApiOperation`：作业列表）
- [ ] 8.6 添加路由 `POST /detail`（`@ApiOperation`：作业详情含答案）
- [ ] 8.7 添加路由 `POST /statistics`（`@ApiOperation`：全量统计数据）
- [ ] 8.8 添加路由 `POST /grade`（`@ApiOperation`：手动批改）
- [ ] 8.9 添加路由 `POST /submissions`（`@ApiOperation`：学生提交列表）

## 9. 控制器实现（学生端）

- [ ] 9.1 实现 `StudentAssignmentController`，`@ApiTags('学生端-作业')`，路由前缀 `/student/assignment`，`@Role('student')`
- [ ] 9.2 添加路由 `POST /list`（学生作业列表）
- [ ] 9.3 添加路由 `POST /detail`（题目详情，过滤答案）
- [ ] 9.4 添加路由 `POST /draft/save`（保存草稿）
- [ ] 9.5 添加路由 `POST /submit`（最终提交）
- [ ] 9.6 添加路由 `POST /result`（查看批改结果）

## 10. 题目图片上传

- [ ] 10.1 在 `AssignmentService` 中实现 `uploadQuestionImage(file, dto)`：写入文件到 `courses/{course_id}/images/`，插入 `course_question_resource` 记录
- [ ] 10.2 在 `TeacherAssignmentController`（或新建 `AssignmentResourceController`）中添加 `POST /assignment/question/image/upload`，`@UseInterceptors(FileInterceptor('file'))`，`@ApiConsumes('multipart/form-data')`，`@ApiOperation`，`@Role('teacher')`
- [ ] 10.3 新建 `dto/upload-question-image.dto.ts`：含 `question_id`、`course_id`、`resource_type`（1或2）及 `@ApiProperty` 注解

## 11. Swagger 文档完善

- [ ] 11.1 确认所有 Controller 路由均有 `@ApiOperation({ summary: '...' })`、`@ApiResponse({ status: 200, ... })`、`@ApiBearerAuth()` 注解
- [ ] 11.2 确认所有 DTO 字段均有 `@ApiProperty` 注解（含 `description`、`example`、`required` 等）
