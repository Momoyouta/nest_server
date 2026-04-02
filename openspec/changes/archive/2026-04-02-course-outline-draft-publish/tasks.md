## 1. 数据模型与存储对齐

- [x] 1.1 使用 MySQL MCP 校验 `course`、`course_chapter`、`course_lesson` 实表字段并确认 `draft_content` 映射差异
- [x] 1.2 更新 `Course` 实体以映射 `draft_content(json)` 并保持 `create_time/update_time` 秒级字符串写入规则
- [x] 1.3 校验并修正 file 模块课程目录创建逻辑，使其与 README 目录结构一致（documents/images/chapters/homework）

## 2. DTO 与 OpenAPI 契约

- [x] 2.1 新增课程大纲 JSON 结构 DTO（课程/章节/课时）并补齐 `@ApiProperty` 与 class-validator 规则
- [x] 2.2 新增五个接口的请求/响应 DTO（4 个管理端 + 1 个课时查询）并统一 `Result<T>` 数据模型
- [x] 2.3 为 DTO 补充示例值（含 `temp_uuid_*` 场景）并保证 Swagger 可直接联调

## 3. 课程大纲服务实现

- [x] 3.1 实现保存草稿服务：仅覆盖 `course.draft_content`，不操作章节课时表
- [x] 3.2 实现发布服务：覆盖草稿 JSON、按 diff 同步章节课时增删改、更新课程发布状态并回传 `id_mappings`（事务内完成）
- [x] 3.3 实现快捷章节标题更新服务：覆盖草稿 JSON + 更新章节标题，不做 diff
- [x] 3.4 实现快捷课时更新服务：覆盖草稿 JSON + 更新课时字段，不做 diff
- [x] 3.5 实现课时查询服务：新增课时查询接口的数据构建器，`admin` 优先草稿，`user` 强制 DB 拼装，支持已发布结构加载

## 4. 控制器与鉴权接入

- [x] 4.1 在 `course.controller` 新增 4 个管理端路由并接入 `@AdminAuth()` 与 `@Role(...AdminRoles)`
- [x] 4.2 在 `course.controller` 新增课时查询路由并接入 `@AllJwtAuth()`
- [x] 4.3 为新增路由补齐 `@ApiOperation`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth` 注解
- [x] 4.4 在课时查询入口接入 ALS `platform` 分流逻辑，并明确章节不新增独立查询接口

## 5. 交付前校验

- [x] 5.1 逐项核对实现与 OpenSpec（proposal/design/specs）一致性并修正文档示例
- [x] 5.2 运行 lint 与构建（如 `pnpm lint`、`pnpm build`）验证无阻塞错误
