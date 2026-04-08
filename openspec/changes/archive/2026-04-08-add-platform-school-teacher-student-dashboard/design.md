## Context

现有系统已具备课程、作业、文件、学校、师生等业务数据，但缺少统一统计域：
- 平台侧无法快速查看入驻转化、全局用户规模、资源占用与内容生态。
- 学校侧缺少教学资产和学情总览。
- 教师侧缺少批改待办、课时漏斗、考情分析。
- 学生侧缺少任务追踪、成绩与教学组学习概览。

本次变更为跨模块统计需求，涉及 `school`、`user`、`course`、`file`、`assignment`、`student-learning-progress` 等数据来源；接口形态采用按业务能力拆分的统计路由。

## Goals / Non-Goals

**Goals:**
- 新增统计模块，提供平台/学校/教师/学生四视角拆分业务 API。
- 输出稳定的 OpenAPI 3.0 契约（查询参数、响应结构、权限要求）。
- 保障多租户隔离与角色边界，避免跨学校数据泄露。
- 支撑调用方按业务模块按需获取统计数据。

**Non-Goals:**
- 不引入机器学习预测、推荐算法。
- 不改造历史业务表结构的核心字段语义。
- 不替换现有 JWT 鉴权体系，只在既有体系上扩展统计接口。

## Decisions

### 决策 1：新增独立统计模块，而非分散到现有业务模块
- 方案：新增 `src/modules/statistics/`，下设 `platform`、`school`、`teacher`、`student` 四类 controller/service 组合；公共聚合逻辑放入 `statistics.service.ts` 与 `query-builders/`。
- 原因：统计查询跨多域，集中治理可统一缓存、口径、鉴权和 OpenAPI 文档。
- 备选：把接口散落到 `school`、`course`、`assignment` 模块。缺点是口径重复、维护成本高。

### 决策 2：采用 TypeORM QueryBuilder + Redis 短期缓存
- 方案：复杂聚合使用 QueryBuilder + 原生 SQL 片段，返回 DTO；热点看板按 `role + tenant + timeRange + metricSet` 缓存 60~300 秒。
- 原因：无需新增离线数仓也可快速上线；缓存可控制查询峰值。
- 备选：新增统计中间表/物化视图。优点是性能稳定，缺点是迁移和一致性复杂度高，本期不采用。

### 决策 3：接口分层与鉴权边界
- 管理端接口统一使用 `@AdminAuth()` + `@Role()`。
- 用户端接口使用普通 JWT，结合 `@Role('teacher')` / `@Role('student')`。
- 教师/学生“当前用户”场景统一通过 `alsService.getUserId()` 获取用户 ID，不从路径参数传入。

### 决策 4：OpenAPI 3.0 接口契约（首期）

1. 平台视角（拆分业务接口，不提供聚合 `overview`）
- 权限：`@AdminAuth()` + `@Role('root','admin')`
- Query：`startTime?`、`endTime?`
- 路由：
  - `GET /admin/statistics/platform/school-funnel` → `Result<SchoolFunnelDto>`
  - `GET /admin/statistics/platform/school-total` → `Result<{ schoolTotal: number }>`
  - `GET /admin/statistics/platform/user-total` → `Result<PlatformUserTotalDto>`
  - `GET /admin/statistics/platform/storage-usage` → `Result<StorageUsageDto>`
  - `GET /admin/statistics/platform/course-summary` → `Result<CourseSummaryDto>`

2. 学校视角（拆分业务接口，不提供聚合 `overview`）
- 权限：`@AdminAuth()` + `@Role('school_root','school_admin','admin','root')`
- Query：`schoolId?`、`startTime?`、`endTime?`
- 路由：
  - `GET /school/statistics/people-summary` → `Result<PeopleSummaryDto>`
  - `GET /school/statistics/course-summary` → `Result<CourseSummaryDto>`
  - `GET /school/statistics/asset-summary` → `Result<AssetSummaryDto>`
  - `GET /school/statistics/learning-summary` → `Result<LearningSummaryDto>`

3. 教师视角（拆分业务接口，不提供聚合 `dashboard`）
- 权限：`@Role('teacher')`
- Query：`courseId?`、`teachingGroupId?`、`assignmentId?`、`startTime?`、`endTime?`；
  其中课程教学组进度与题目分析接口额外支持 `page?`、`pageSize?`、`sortBy?`、`sortOrder?`
- 路由：
  - `GET /teacher/statistics/todo` → `Result<TeacherTodoDto>`
  - `GET /teacher/statistics/lesson-funnel` → `Result<LessonFunnelItemDto[]>`
  - `GET /teacher/statistics/score-distribution` → `Result<ScoreDistributionDto>`
  - `GET /teacher/statistics/objective-question-accuracy` → `Result<TeacherObjectiveQuestionAccuracyPageDto>`
  - `GET /teacher/statistics/fill-question-score-rate` → `Result<TeacherFillQuestionScoreRatePageDto>`
  - `GET /teacher/statistics/short-answer-score-rate` → `Result<TeacherShortAnswerQuestionScoreRatePageDto>`
  - `GET /teacher/statistics/submission-status` → `Result<SubmissionStatusDto>`
  - `GET /teacher/statistics/course-group-progress` → `Result<TeacherCourseGroupProgressDto>`
- 客观题正确率接口（单选/多选/判断）返回题号与正确率；填空题、简答题接口返回题号与得分率。
- 课程教学组进度接口返回学生姓名、头像路径、课程进度，并返回教学组总人数与 100% 进度人数；
  支持 `completedOnly` 筛选仅返回 100% 进度学生。

4. 学生视角（拆分业务接口，不提供聚合 `learning-center`）
- 权限：`@Role('student')`
- Query：`courseId?`、`startTime?`、`endTime?`（其中教学组学习概览接口要求 `courseId` 必传）
- 路由：
  - `GET /student/statistics/my-courses` → `Result<StudentCourseProgressItemDto[]>`
  - `GET /student/statistics/continue-learning` → `Result<ContinueLearningDto | null>`
  - `GET /student/statistics/todo-assignments` → `Result<TodoAssignmentItemDto[]>`
  - `GET /student/statistics/grade-history` → `Result<GradeHistoryItemDto[]>`
  - `GET /student/statistics/group-learning-summary` → `Result<StudentCourseGroupLearningSummaryDto>`
- 首屏仅返回看板必需字段，详细内容通过二次请求获取。

5. `GET /admin/statistics/dictionary`
- 权限：`@AdminAuth()` + `@Role('root','admin','school_root','school_admin')`
- 用途：返回图表筛选项与指标映射（课程、教学组、分数段配置）。

### 决策 5：TypeORM 实体变更策略
- 本期不新增/修改业务实体字段，优先复用现有表聚合查询（`school_applications`、`school`、`user_school_identity`、`course`、`file_chunk`、`course_student`、`course_learning_record`、`course_assignment`、`assignment_submission`、`assignment_answer_detail`）。
- 若后续性能压测不达标，再在后续 change 中引入统计快照表（本期不做 schema migration）。

### 决策 6：后端契约与口径统一
- 以 Swagger 作为唯一接口契约来源，保证拆分路由与字段含义稳定。
- 输出接口示例与字段注释，保证调用方可独立完成模块化接入。
- 对齐枚举/映射文件：在后端 `src/common/utils` 维护统计口径映射（如 `statistics-metric.map.ts`）。

## Risks / Trade-offs

- [风险：多表聚合查询慢] -> 通过索引检查、SQL 优化、短期缓存、分页与时间范围限制缓解。
- [风险：跨租户数据误聚合] -> 所有查询强制带 `school_id`/角色上下文，增加单元测试覆盖越权场景。
- [风险：统计口径与调用方展示不一致] -> 固化字段定义与 OpenAPI 示例，联调阶段按同一 mock 校验。
- [风险：历史脏数据导致指标波动] -> 在响应中返回 `dataVersion` 与 `generatedAt`，并记录异常告警。

## Migration Plan

1. 新增统计模块代码骨架（controller/service/dto/map）。
2. 完成四视角核心接口与 Swagger 注解。
3. 完成角色鉴权、租户隔离、缓存接入。
4. 组织接口联调并修正字段口径。
5. 灰度发布：先开放平台与学校视角，再开放教师/学生视角。

回滚策略：
- 保留原业务接口不变；若统计接口异常，按路由维度关闭统计 controller 导出或降级返回空统计结构，不影响主流程。

## Open Questions

- 无。当前已确认：学校侧不做学院层级二级下钻；学生侧采用教学组学习概览（作业平均分、组内平均分排名、课程学习次数）；暂不支持 Excel 导出。