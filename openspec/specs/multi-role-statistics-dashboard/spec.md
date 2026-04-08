# multi-role-statistics-dashboard Specification

## Purpose
定义平台、学校、教师、学生四类角色的统计看板拆分接口与统一约束，替代聚合统计路由，确保响应一致性与租户隔离。

## Requirements

### Requirement: 平台视角业务接口拆分
系统 MUST 提供平台视角拆分接口（不得通过单一聚合接口返回全部平台指标）：
- `GET /admin/statistics/platform/school-funnel` → `Result<SchoolFunnelDto>`
- `GET /admin/statistics/platform/school-total` → `Result<{ schoolTotal: number }>`
- `GET /admin/statistics/platform/user-total` → `Result<PlatformUserTotalDto>`
- `GET /admin/statistics/platform/storage-usage` → `Result<StorageUsageDto>`
- `GET /admin/statistics/platform/course-summary` → `Result<CourseSummaryDto>`
- Query 参数均支持 `startTime?`、`endTime?`，并应用统一时间范围校验。

#### Scenario: 平台管理员获取学校漏斗
- **WHEN** `root/admin` 角色调用 `GET /admin/statistics/platform/school-funnel?startTime=1711929600&endTime=1714521600`
- **THEN** 返回 `code=200` 且 `data` 仅包含 `totalApply`、`approved`、`rejected`

#### Scenario: 平台管理员获取用户规模
- **WHEN** `root/admin` 角色调用 `GET /admin/statistics/platform/user-total`
- **THEN** 返回 `code=200` 且 `data` 仅包含 `total`、`teacherTotal`、`studentTotal`

### Requirement: 学校视角业务接口拆分
系统 MUST 提供学校视角拆分接口（不得通过单一聚合接口返回全部学校指标）：
- `GET /school/statistics/people-summary` → `Result<PeopleSummaryDto>`
- `GET /school/statistics/course-summary` → `Result<CourseSummaryDto>`
- `GET /school/statistics/asset-summary` → `Result<AssetSummaryDto>`
- `GET /school/statistics/learning-summary` → `Result<LearningSummaryDto>`
- Query 参数支持 `schoolId?`、`startTime?`、`endTime?`，并遵守租户隔离。

#### Scenario: 学校管理员查看人员概览
- **WHEN** `school_root/school_admin` 角色调用 `GET /school/statistics/people-summary` 且未传 `schoolId`
- **THEN** 系统使用登录上下文中的学校 ID 返回本校人员统计

### Requirement: 教师视角业务接口拆分
系统 MUST 提供教师视角拆分接口（不得通过单一 `dashboard` 聚合接口返回全部指标）：
- `GET /teacher/statistics/todo` → `Result<TeacherTodoDto>`
- `GET /teacher/statistics/lesson-funnel` → `Result<LessonFunnelItemDto[]>`
- `GET /teacher/statistics/score-distribution` → `Result<ScoreDistributionDto>`
- `GET /teacher/statistics/objective-question-accuracy` → `Result<TeacherObjectiveQuestionAccuracyPageDto>`
- `GET /teacher/statistics/fill-question-score-rate` → `Result<TeacherFillQuestionScoreRatePageDto>`
- `GET /teacher/statistics/short-answer-score-rate` → `Result<TeacherShortAnswerQuestionScoreRatePageDto>`
- `GET /teacher/statistics/submission-status` → `Result<SubmissionStatusDto>`
- `GET /teacher/statistics/course-group-progress` → `Result<TeacherCourseGroupProgressDto>`
- Query 参数支持 `courseId?`、`teachingGroupId?`、`assignmentId?`、`startTime?`、`endTime?`；
	其中 `course-group-progress` 额外支持 `page?`、`pageSize?`、`sortBy?`、`sortOrder?`、`completedOnly?`，
	三个题目分析接口额外支持 `page?`、`pageSize?`、`sortBy?`、`sortOrder?`。

#### Scenario: 教师查看客观题正确率
- **WHEN** 教师调用 `GET /teacher/statistics/objective-question-accuracy?courseId=12&assignmentId=301&page=1&pageSize=20&sortBy=rate&sortOrder=DESC`
- **THEN** 返回项仅包含 `questionNo`、`correctRate`，并包含分页信息

#### Scenario: 教师查看填空题得分率
- **WHEN** 教师调用 `GET /teacher/statistics/fill-question-score-rate?courseId=12&page=1&pageSize=20&sortBy=rate&sortOrder=DESC`
- **THEN** 返回项仅包含 `questionNo`、`scoreRate`，并包含分页信息

#### Scenario: 教师查看简答题得分率
- **WHEN** 教师调用 `GET /teacher/statistics/short-answer-score-rate?courseId=12&page=1&pageSize=20&sortBy=questionNo&sortOrder=ASC`
- **THEN** 返回项仅包含 `questionNo`、`scoreRate`，并包含分页信息

#### Scenario: 教师查看课程教学组学生进度
- **WHEN** 教师调用 `GET /teacher/statistics/course-group-progress?courseId=12&teachingGroupId=88&page=1&pageSize=20&sortBy=progressPercent&sortOrder=DESC&completedOnly=1`
- **THEN** 返回 `data.list` 包含学生姓名、头像路径、课程进度，并返回 `totalStudents` 与 `completedStudents`

### Requirement: 学生视角业务接口拆分
系统 MUST 提供学生视角拆分接口（不得通过单一 `learning-center` 聚合接口返回全部指标）：
- `GET /student/statistics/my-courses` → `Result<StudentCourseProgressItemDto[]>`
- `GET /student/statistics/continue-learning` → `Result<ContinueLearningDto | null>`
- `GET /student/statistics/todo-assignments` → `Result<TodoAssignmentItemDto[]>`
- `GET /student/statistics/grade-history` → `Result<GradeHistoryItemDto[]>`
- `GET /student/statistics/group-learning-summary` → `Result<StudentCourseGroupLearningSummaryDto>`（`courseId` 必传）

#### Scenario: 学生查看课程教学组学习概览
- **WHEN** 学生调用 `GET /student/statistics/group-learning-summary?courseId=12`
- **THEN** 返回 `courseId`、`teachingGroupId`、`assignmentAvgScore`、`avgScoreRank`、`courseLearnCount`

### Requirement: 禁用聚合统计路由
系统 MUST 不再暴露以下聚合统计路由：
- `/admin/statistics/platform/overview`
- `/school/statistics/overview`
- `/teacher/statistics/dashboard`
- `/student/statistics/learning-center`

#### Scenario: 请求已移除聚合路由
- **WHEN** 客户端调用任意已移除的聚合统计路由
- **THEN** 系统返回路由不存在或等效错误响应，不再返回聚合数据

### Requirement: 统一响应与租户隔离约束
所有统计接口 MUST 使用 `Result<T>` 包装响应，并遵循以下约束：
- `data` 字段必须存在；无数据时返回空对象/空数组而非 `null`。
- 统计查询 MUST 绑定角色与租户上下文，禁止跨学校数据泄露。
- 对资源不存在或参数不合法场景 MUST 抛出标准 HttpException，不得静默返回。

#### Scenario: 非法跨租户访问被拦截
- **WHEN** 学校管理员尝试通过参数查询其他学校数据
- **THEN** 系统拒绝请求并返回权限或参数错误响应