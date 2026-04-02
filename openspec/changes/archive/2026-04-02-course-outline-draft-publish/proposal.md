## Why

当前前端在编辑课程大纲（章节/课时）时若按“新增即落库”模式，会导致接口调用碎片化、失败补偿复杂、发布一致性差。需要引入“草稿集中编辑 + 统一发布”流程，降低交互成本并确保发布态数据可信。

## What Changes

- 在 `course` 增加 `draft_content`（JSON）字段：保存草稿时仅覆盖该字段，不落库章节/课时业务表。
- 新增 5 个 OpenAPI 接口（4 个管理端 + 1 个课时查询接口）：
  - 保存课程草稿（覆盖 `draft_content`）
  - 正式发布课程（覆盖 `draft_content`，解析 JSON 与旧数据 diff 后落库 `chapter/lesson`，并回传 `temp_uuid_* -> real_id` 映射）
  - 快速修改章节标题（覆盖草稿 JSON + 更新章节表）
  - 快速更新课时数据（覆盖草稿 JSON + 更新课时表）
  - 新增课时查询接口（从 ALS 读取 `platform`，`admin` 端优先返回草稿 JSON，`user` 端基于数据库拼装返回）
- 章节不新增独立查询接口。
- `builder` 支持加载已发布结构（DB -> JSON）。
- 调整文件模块中“创建课程目录”逻辑，对齐 README 目录规范。

## Goals

- 支持前端一次性编辑完整大纲并统一保存/发布。
- 确保发布态查询始终以数据库为准，避免 JSON 与业务表长期漂移。
- 在不增加前端 diff 成本的前提下，支持章节标题与课时的快捷更新。

## Non-goals

- 本次不新增除约定 5 个接口之外的其他对外接口。
- 本次不改造用户端权限体系与 JWT 机制。
- 本次不重写既有文件上传协议（仅调整课程目录创建逻辑）。

## Capabilities

### New Capabilities
- `course-outline-draft-publish`: 课程大纲草稿保存、发布落库、平台化查询与快捷更新能力。

### Modified Capabilities
- `admin-course-management`: 扩展课程模型与管理端接口，补充课程目录创建行为与发布流程约束。

## Impact

- 受影响模块：`course`、`school_admin`、`file`、相关 DTO/Entity/Service。
- 数据库影响：`course` 表新增 `draft_content` 字段；发布流程涉及章节/课时表增删改。
- API 影响：新增 5 个接口（4 管理端 + 1 课时查询）并补充 Swagger 注解与响应模型。
- 实施约束：实现阶段需使用 MySQL MCP 校验真实表结构后再落地实体与 SQL 变更。
