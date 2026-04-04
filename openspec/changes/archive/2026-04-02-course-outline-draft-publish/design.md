## Context

当前课程模块仅覆盖课程基础 CRUD，章节/课时主要存在于实体和删除级联逻辑中，尚未形成“草稿编辑 + 统一发布”的管理流程。根据 MySQL 实表（`study_platform`）核验：
- `course` 含 `draft_content(json)` 列；
- `course_chapter` 字段为 `id/course_id/title/sort_order/create_time/update_time`；
- `course_lesson` 字段为 `id/chapter_id/title/description/video_path/duration/sort_order/create_time/update_time`。

约束：
- 对外新增 5 个接口（4 个管理端 + 1 个课时查询接口）；
- 查询发布态课程必须以数据库为准；
- `admin` 与 `user` 查询行为按 ALS `platform` 分流；
- 保持 NestJS + TypeORM + Swagger + Result<T> 响应风格。

## Goals / Non-Goals

**Goals:**
- 让前端可一次性编辑课程大纲 JSON，并支持“存草稿/统一发布”。
- 发布时基于 JSON 与数据库差异执行章节/课时增删改，保证数据一致。
- 提供章节标题与课时的快捷更新能力（覆盖草稿 + 单表更新，无需 diff）。
- 文件模块课程目录创建行为与 README 目录结构保持一致。

**Non-Goals:**
- 不扩展除约定 5 个接口之外的公开接口。
- 不改造现有 JWT 体系和角色定义。
- 不重构文件分块上传协议本身。

## Decisions

### D1. 课程草稿采用 `course.draft_content` 作为单一草稿源
- 决策：保存草稿、快速更新章节/课时都直接覆盖 `draft_content`。
- 原因：前端一次编辑后整包提交，后端无需高频子项写入。
- 备选：按章节/课时逐条落库再反推 JSON。放弃原因：接口频繁、失败补偿复杂、前端联动成本高。

### D2. OpenAPI 新增 5 个接口（4 管理端 + 1 课时查询）
1. `POST /course/saveCourseDraftAdmin`
- Auth: `@AdminAuth()` + `@Role(...AdminRoles)`
- Body:
  - `course_id: string`
  - `draft_content: CourseOutlineDraftDto`（与约定 JSON 结构一致）
- Response: `Result<{ course_id: string; updated: true }>`

2. `POST /course/publishCourseOutlineAdmin`
- Auth: `@AdminAuth()` + `@Role(...AdminRoles)`
- Body:
  - `course_id: string`
  - `draft_content: CourseOutlineDraftDto`
- Response: `Result<{ course_id: string; published: true; chapter_count: number; lesson_count: number; id_mappings: { chapters: Array<{ temp_id: string; real_id: string }>; lessons: Array<{ temp_id: string; real_id: string }> } }>`

3. `PUT /course/updateChapterTitleQuickAdmin`
- Auth: `@AdminAuth()` + `@Role(...AdminRoles)`
- Body:
  - `course_id: string`
  - `draft_content: CourseOutlineDraftDto`
  - `chapter: { chapter_id: string; title: string }`
- Response: `Result<{ course_id: string; chapter_id: string; updated: true }>`

4. `PUT /course/updateLessonQuickAdmin`
- Auth: `@AdminAuth()` + `@Role(...AdminRoles)`
- Body:
  - `course_id: string`
  - `draft_content: CourseOutlineDraftDto`
  - `lesson: { lesson_id: string; chapter_id: string; title: string; description?: string; video_path?: string | null; duration?: number; sort_order: number }`
- Response: `Result<{ course_id: string; lesson_id: string; updated: true }>`

5. `GET /course/getCourseLessonOutline/:id`
- Auth: `@AllJwtAuth()`
- Path:
  - `id: string`（课程 ID）
- Response: `Result<CourseOutlineDraftDto>`

补充：章节不新增独立查询接口；课时查询使用新增接口统一承载章节+课时结构返回。

### D3. 查询策略按 ALS `platform` 分流
- 决策：在 `GET /course/getCourseLessonOutline/:id` 中先读 `alsService.get('platform')`。
  - `admin`：优先返回 `draft_content`；若草稿为空则 DB 构建 JSON 返回。
  - `user`：始终从 `course_chapter + course_lesson` 查询并拼装 JSON。
- 原因：管理端需要草稿即时态，用户端必须读发布态。
- 备选：统一读 `draft_content`。放弃原因：会污染用户发布态语义。

### D4. 发布流程使用事务 + 差异同步
- 决策：`publishCourseOutlineAdmin` 在事务内执行：
  1) 覆盖 `course.draft_content`；
  2) 解析 JSON 与现有 DB 数据比对；
  3) 章节/课时执行 upsert 与删除；
  4) 更新 `course.status=1`；
  5) 汇总 `temp_uuid_* -> real_id` 映射；
  6) 返回最终统计与映射结果。
- 临时 ID 处理：`temp_uuid_*` 视为新增，写库后生成真实 ID；内部维护临时-真实映射用于课时归属。
- 备选：全量先删后插。放弃原因：会丢失稳定 ID、审计与关联风险高。

### D5. 快捷更新不做 diff
- 决策：`updateChapterTitleQuickAdmin`、`updateLessonQuickAdmin` 按前端传入“完整草稿 JSON + 单项变更体”执行：
  - 直接覆盖 `draft_content`；
  - 仅更新对应章节标题或课时记录。
- 原因：场景明确不涉及增删，直接覆盖最稳定。
- 备选：后端再做 JSON diff。放弃原因：重复计算、收益低。

### D6. TypeORM 与 DTO 变更
- `Course` 实体补齐 `draft_content` 映射（`@Column({ type: 'json', nullable: true })`）。
- 新增 DTO：
  - `CourseOutlineDraftDto`（课程/章节/课时 JSON 结构）
  - `SaveCourseDraftDto`
  - `PublishCourseOutlineDto`
  - `QuickUpdateChapterTitleDto`
  - `QuickUpdateLessonDto`
- 所有 DTO 必须补充 Swagger 注解与 class-validator 约束。

### D7. 文件模块目录创建对齐 README
- 决策：校验并修正 `StorageService.createCourseDir` 生成目录，确保至少包含：`documents/`、`images/`、`chapters/`、`homework/`。
- 若 README 有新增标准子目录，以 README 为准同步。
- 备选：保持现状不校验。放弃原因：目录规范会与文档漂移。

### D8. 守卫与权限
- 4 个新增接口均为管理端，统一 `@AdminAuth()` + `@Role(...AdminRoles)`。
- 新增课时查询接口使用 `@AllJwtAuth()`，并在服务层依据 ALS `platform` 分流。
- 查询行为改造仍遵循既有 JWT 流程，不使用 `@isPublic()`。

## Risks / Trade-offs

- [风险] 发布 diff 逻辑复杂，临时 ID 映射错误会导致课时挂错章节  
  → Mitigation：先构建章节映射表，再处理课时；加入事务与完整单测。
- [风险] 草稿 JSON 与 DB 结构长期偏离  
  → Mitigation：管理端查询优先草稿，但用户端永远读 DB；发布后回写标准化草稿。
- [风险] 并发发布导致覆盖  
  → Mitigation：发布前校验 `update_time`（乐观并发）或行级锁。

## Migration Plan

1. 使用 MySQL MCP 再次确认线上目标库 `course.draft_content` 列存在；若缺失则补充 DDL。
2. 更新 `Course` 实体映射与 DTO/Controller/Service。
3. 上线后旧课程 `draft_content` 允许为 `null`，首次保存草稿即初始化。
4. 回滚策略：
- 代码回滚到旧版本；
- `draft_content` 列可保留（向后兼容，不影响旧逻辑）。

## Open Questions

- 无。

已确认结论：
- 发布后 MUST 回传真实 ID 映射结果，以替换前端本地 `temp_uuid_*`。
- 章节不新增查询接口；课时查询新增独立接口。
- 发布失败时不保留失败前草稿快照版本号。
