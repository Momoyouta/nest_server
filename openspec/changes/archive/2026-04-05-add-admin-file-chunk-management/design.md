## Context

当前系统已有 `file_chunk` 上传链路（初始化、上传、合并、进度查询），但缺少管理端对已落库文件的治理能力。`file_chunk` 已包含 `file_hash`、`file_name`、`file_size`、`status`、`target_path`、`type`、`creator_id`、`school_id`、`create_time`、`update_time` 等字段，可直接支撑管理查询与运维操作。

本次变更需要新增管理端模块，覆盖分页条件查询、重命名、删除（含物理文件）、迁移到学校资源库目录，并保证 Swagger/OpenAPI 与 DTO 校验完整。

## Goals / Non-Goals

**Goals:**
- 提供管理端 `file_chunk` 分页条件查询，支持 `id`、`file_hash`、`filename` 模糊、`status`、`type`、`creatorId`、`schoolId` 条件。
- 查询返回中补充 `creatorName`（创建者姓名）和 `schoolName`（学校名）。
- 查询支持 `create_time`、`update_time`、`file_size` 排序。
- 提供仅更新文件名接口。
- 提供删除记录并删除物理文件接口。
- 提供将文件迁移到指定学校资源库目录的接口（按 `type` 分流到 `videos`/`documents`，并使用 hash+二级目录）。

**Non-Goals:**
- 不改动分片上传/合并协议与现有上传入口。
- 不新增 `file_chunk` 表结构字段。
- 不返回 `total_chunks` 和 `uploaded_chunks` 给管理端查询接口。

## Decisions

### 1) 模块与鉴权边界
- 在管理端模块新增独立控制器/服务（放在 `src/modules/file_admin` 下，与 `school_admin` 同级），统一前缀 `admin/fileChunk`。
- 所有接口使用 `@AdminAuth()`，并通过 `@Role()` 约束为管理端角色（`root/admin/school_root/school_admin`）。
- 角色数据范围约束：`school_root/school_admin` 仅允许操作所属学校数据；`root/admin` 可跨学校操作。
- 接口返回统一 `Result<T>`，并补充 Swagger 注解：`@ApiTags`、`@ApiOperation`、`@ApiQuery`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth`。

### 2) OpenAPI 3.0 接口契约
- `GET /admin/fileChunk/query`
  - Query 参数：
    - `page`(int, >=1, default 1)
    - `pageSize`(int, >=1, <=100, default 10)
    - `id`(string, 可选)
    - `fileHash`(string, 可选)
    - `filename`(string, 可选，模糊匹配)
    - `status`(enum: pending|merging|done|expired)
    - `type`(enum: 1|2)
    - `creatorId`(string, 可选)
    - `schoolId`(string, 可选)
    - `sortBy`(enum: createTime|updateTime|fileSize, default updateTime)
    - `sortOrder`(enum: ASC|DESC, default DESC)
  - 响应：`{ items: FileChunkAdminItem[], total: number }`
  - `FileChunkAdminItem` 包含 `file_chunk` 主体字段 + `creatorName` + `schoolName`，明确不包含 `totalChunks/uploadedChunks`。

- `PATCH /admin/fileChunk/updateFilename`
  - Body：`{ id: string, fileName: string }`
  - 校验：`id` 必填；`fileName` 必填、去首尾空格后长度 1~255。
  - 行为：仅更新 `file_name` 与 `update_time`。

- `DELETE /admin/fileChunk/delete`
  - Query 或 Body：`id`、`force`（可选，默认 `false`）。
  - 行为：默认先删真实文件再删记录；当 `force=true` 时允许强制清理记录。

- `POST /admin/fileChunk/moveToSchool`
  - Body：`{ fileId: string, schoolId: string }`
  - 行为：不新增 `file_chunk`；仅允许 `status=done` 记录执行迁移并更新记录。

### 3) 查询实现
- 使用 TypeORM QueryBuilder，以 `file_chunk` 为主表，左连接：
  - `user`：`file_chunk.creator_id = user.id`，取 `user.name AS creatorName`
  - `school`：`file_chunk.school_id = school.id`，取 `school.name AS schoolName`
- 条件过滤按“有值才拼接”原则构建；`filename` 使用 `LIKE %keyword%`。
- 对 `school_root/school_admin` 自动追加 `fc.school_id = 当前管理员所属 school_id` 约束；忽略跨校查询参数。
- 排序字段采用白名单映射，避免 SQL 注入：
  - `createTime -> fc.create_time`
  - `updateTime -> fc.update_time`
  - `fileSize -> fc.file_size`

### 4) 删除与物理文件一致性
- 从记录计算相对文件路径：优先基于 `target_path + file_hash + 扩展名` 组装；扩展名来自 `file_name`。
- 默认模式（`force=false`）下，调用文件服务删除物理文件；物理文件删除成功后再删除数据库记录。
- 若物理删除失败且 `force=false`，接口返回错误并保留表记录，避免“记录不存在但文件残留不可追踪”。
- 若 `force=true`，允许跳过物理文件异常并继续删除数据库记录，用于脏数据强制清理。

### 5) 迁移到学校资源库目录
- `type=1`：目标目录 `schools/{schoolId}/resource_library/videos/{dir1}/{dir2}`。
- `type=2`：目标目录 `schools/{schoolId}/resource_library/documents/{dir1}/{dir2}`。
- `dir1=fileHash[0..1]`，`dir2=fileHash[2..3]`，目标文件名 `{fileHash}.{ext}`。
- 源文件通过当前记录定位，且仅允许 `status=done` 文件迁移；迁移后更新：
  - `target_path` = 目标目录（不含文件名，保持现有语义）
  - `school_id` = 新学校 ID
  - `update_time` = 当前时间

### 6) TypeORM 实体与 DTO 变更
- `FileChunk`、`User`、`School` 实体不新增列、不改关联（无 DDL 变更）。
- 新增管理端 DTO：
  - 查询 DTO（分页、过滤、排序参数及校验）
  - 重命名 DTO
  - 迁移 DTO
- 新增响应 DTO：管理查询项（显式排除 `totalChunks/uploadedChunks`，增加 `creatorName/schoolName`）。

## Risks / Trade-offs

- [文件系统与数据库非同事务] → 采用“先删文件再删记录”的顺序；若删文件失败则直接失败并保留记录。
- [历史数据 target_path 可能异常] → 增加路径解析与存在性校验，不合法路径直接返回 400。
- [大表分页查询性能] → 通过筛选条件和排序白名单控制扫描范围；必要时补充索引（`file_hash/status/type/creator_id/school_id`）。
- [跨学校移动的权限边界] → 已落地学校级数据隔离：`school_root/school_admin` 强制限定所属学校，`root/admin` 允许跨校；通过统一作用域校验避免越权。

## Migration Plan

1. 新增管理端 controller/service/dto，并在模块中注册。
2. 增加 Swagger 注解，生成 OpenAPI 文档。
3. 本次无数据库结构迁移，仅涉及应用层逻辑发布。
4. 回滚策略：回退新增路由与服务代码，不影响既有上传链路和表结构。

## Open Questions

- 无。以下关键策略已确认并纳入本设计：
  - 删除接口允许 `force=true` 强制清理记录。
  - `school_root/school_admin` 仅允许操作所属学校数据范围。
  - 迁移接口仅允许 `status=done` 的文件执行。
