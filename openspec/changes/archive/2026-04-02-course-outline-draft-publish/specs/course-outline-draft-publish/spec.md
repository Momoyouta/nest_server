# course-outline-draft-publish Specification

## Purpose
定义课程大纲“草稿保存、统一发布、快捷更新、平台分流查询”的行为契约，支撑前端集中编辑后一次提交。

## ADDED Requirements

### Requirement: 系统必须提供课程大纲草稿保存接口
系统 SHALL 提供 `POST /course/saveCourseDraftAdmin` 接口。接口 MUST 使用 `@AdminAuth()` 与 `@Role(...AdminRoles)` 进行管理端鉴权，并返回 `Result<T>` 结构。

`SaveCourseDraftDto` MUST 至少满足以下校验：
- `course_id`: `@IsString @IsNotEmpty`
- `draft_content`: `@IsObject` 且非空
- `draft_content.course_id`: `@IsString @IsNotEmpty`
- `draft_content.school_id`: `@IsString @IsNotEmpty`
- `draft_content.status`: `@Type(() => Number) @IsIn([0,1])`
- `draft_content.chapters`: `@IsArray`，数组元素为 chapter 对象
- chapter.title: `@IsString @IsNotEmpty @MaxLength(255)`
- chapter.sort_order: `@Type(() => Number) @IsInt @Min(0)`
- chapter.lessons: `@IsArray`
- lesson.title: `@IsString @IsNotEmpty @MaxLength(255)`
- lesson.sort_order: `@Type(() => Number) @IsInt @Min(0)`
- lesson.duration: `@Type(() => Number) @IsInt @Min(0)`

保存逻辑 MUST 仅覆盖 `course.draft_content` 字段，不得在该接口中创建/更新/删除 `course_chapter` 与 `course_lesson` 记录。

#### Scenario: 管理员保存草稿成功
- **WHEN** 管理员提交合法 `course_id` 与 `draft_content` 调用草稿保存接口
- **THEN** 系统仅更新 `course.draft_content` 并返回 `updated=true`

#### Scenario: 草稿保存请求缺少必填字段
- **WHEN** 管理员提交缺少 `course_id` 或 `draft_content` 的请求
- **THEN** 系统返回 400 校验错误且不修改数据库

### Requirement: 系统必须提供课程大纲发布接口并执行差异同步
系统 SHALL 提供 `POST /course/publishCourseOutlineAdmin` 接口。接口 MUST 使用 `@AdminAuth()` 与 `@Role(...AdminRoles)` 进行管理端鉴权，并返回 `Result<T>` 结构。

接口响应 MUST 包含 `id_mappings`，用于返回发布过程中新建节点的真实 ID 映射：
- `id_mappings.chapters`: `Array<{ temp_id: string; real_id: string }>`
- `id_mappings.lessons`: `Array<{ temp_id: string; real_id: string }>`

发布逻辑 MUST 在单事务内执行：
1. 覆盖 `course.draft_content` 为请求中的最新 JSON。
2. 解析 JSON，并与数据库中的 `course_chapter/course_lesson` 进行差异比对。
3. 对章节执行新增/更新/删除；对课时执行新增/更新/删除。
4. 将课程状态更新为已发布（`status=1`）。

差异规则 MUST 满足：
- `chapter_id` 或 `lesson_id` 以 `temp_uuid_` 开头时，MUST 视为新增。
- 非 `temp_uuid_` 且存在于数据库时，MUST 视为更新。
- 数据库存在但 JSON 中缺失的章节/课时，MUST 删除。
- 新增与更新时，MUST 正确维护 `create_time/update_time`（秒级字符串）。

#### Scenario: 发布时同时包含新增、更新与删除
- **WHEN** 管理员提交包含 `temp_uuid_*`、已有真实 ID、且移除部分旧节点的草稿 JSON 进行发布
- **THEN** 系统在一次事务中完成章节课时的增删改并返回 `published=true`

#### Scenario: 发布后返回真实 ID 映射
- **WHEN** 草稿 JSON 中包含 `temp_uuid_*` 章节或课时并发布成功
- **THEN** 系统在响应中返回 `id_mappings`，使前端可将临时 ID 替换为真实 ID

#### Scenario: 发布过程中任一步骤失败
- **WHEN** 发布事务中任意数据库操作失败
- **THEN** 系统回滚整个事务，章节课时与课程发布状态不发生部分提交

### Requirement: 系统必须提供章节标题快捷更新接口
系统 SHALL 提供 `PUT /course/updateChapterTitleQuickAdmin` 接口。接口 MUST 使用 `@AdminAuth()` 与 `@Role(...AdminRoles)`。

`QuickUpdateChapterTitleDto` MUST 至少包含：
- `course_id`: `@IsString @IsNotEmpty`
- `draft_content`: `@IsObject`
- `chapter.chapter_id`: `@IsString @IsNotEmpty`
- `chapter.title`: `@IsString @IsNotEmpty @MaxLength(255)`

快捷更新逻辑 MUST：
- 直接覆盖 `course.draft_content`；
- 直接更新目标章节 `title` 与 `update_time`；
- 不执行章节或课时的 diff 计算。

#### Scenario: 快捷更新章节标题成功
- **WHEN** 管理员传入已存在章节 ID 与新标题调用接口
- **THEN** 系统覆盖草稿 JSON、更新章节标题并返回 `updated=true`

### Requirement: 系统必须提供课时快捷更新接口
系统 SHALL 提供 `PUT /course/updateLessonQuickAdmin` 接口。接口 MUST 使用 `@AdminAuth()` 与 `@Role(...AdminRoles)`。

`QuickUpdateLessonDto` MUST 至少包含：
- `course_id`: `@IsString @IsNotEmpty`
- `draft_content`: `@IsObject`
- `lesson.lesson_id`: `@IsString @IsNotEmpty`
- `lesson.chapter_id`: `@IsString @IsNotEmpty`
- `lesson.title`: `@IsString @IsNotEmpty @MaxLength(255)`
- `lesson.sort_order`: `@Type(() => Number) @IsInt @Min(0)`
- `lesson.duration`: `@Type(() => Number) @IsInt @Min(0)`
- `lesson.description`: 可选 `@IsString`
- `lesson.video_path`: 可选 `@IsString` 或 `null`

快捷更新逻辑 MUST：
- 直接覆盖 `course.draft_content`；
- 直接更新目标课时字段与 `update_time`；
- 不执行章节或课时 diff。

#### Scenario: 快捷更新课时成功
- **WHEN** 管理员传入已存在课时 ID 与更新后的课时数据调用接口
- **THEN** 系统覆盖草稿 JSON、更新课时记录并返回 `updated=true`

### Requirement: 系统必须提供课时查询接口并按平台区分数据源
系统 SHALL 提供 `GET /course/getCourseLessonOutline/:id` 接口用于课时查询，并返回章节+课时结构。
接口 MUST 使用 `@AllJwtAuth()`，并在查询流程中先读取 ALS `platform`。
- 当 `platform=admin` 时，系统 MUST 优先返回 `course.draft_content`；若为空则从数据库构建同结构 JSON 返回。
- 当 `platform=user` 时，系统 MUST 始终从 `course_chapter/course_lesson` 查询并拼装 JSON，不得直接返回草稿 JSON。

章节不新增独立查询接口。

#### Scenario: 管理端课时查询优先返回草稿
- **WHEN** 管理端用户调用课时查询接口，且课程存在 `draft_content`
- **THEN** 系统直接返回草稿 JSON

#### Scenario: 用户端课时查询仅返回发布态
- **WHEN** 用户端用户调用课时查询接口
- **THEN** 系统从数据库拼装 JSON 返回，且不读取草稿 JSON 作为响应源
