## 1. 管理端模块骨架与路由接入

- [x] 1.1 在 `src/modules/file_admin` 下新增 `file_chunk` 管理端 controller/service 文件并完成依赖注入。
- [x] 1.2 在 `file_admin.module.ts` 中注册新 controller/service，并在 `app.module.ts` 挂载模块，确认路由前缀为 `admin/fileChunk`。
- [x] 1.3 为新接口统一接入 `@AdminAuth()` 与 `@Role(root/admin/school_root/school_admin)`。

## 2. DTO 与返回模型定义（含 Swagger）

- [x] 2.1 新增分页查询 DTO（过滤字段、排序字段）并补齐 class-validator 规则与 `@ApiProperty`/`@ApiPropertyOptional`。
- [x] 2.2 新增更新文件名 DTO 与迁移 DTO，并补齐必填、长度、枚举校验及 `@ApiProperty` 注解。
- [x] 2.3 新增查询响应项 DTO，显式包含 `creatorName`、`schoolName`，显式排除 `totalChunks`、`uploadedChunks`。
- [x] 2.4 在 `src/common/utils` 新增或补充 file-chunk 相关 map（排序字段映射、允许 type/status 枚举）以统一硬编码常量。

## 3. 分页条件查询实现

- [x] 3.1 在 service 中实现 `GET /admin/fileChunk/query` 对应查询逻辑，基于 QueryBuilder 拼装可选过滤条件。
- [x] 3.2 增加与 `user`、`school` 的左连接，返回 `creatorName` 和 `schoolName`。
- [x] 3.3 实现排序白名单映射（`createTime/updateTime/fileSize`）与分页（`skip/take`）。
- [x] 3.4 序列化响应数据，确保不返回 `totalChunks`、`uploadedChunks`。
- [x] 3.5 增加角色数据域限制：`school_root/school_admin` 查询时强制限定所属 `school_id`。

## 4. 更新/删除/迁移实现

- [x] 4.1 实现 `PATCH /admin/fileChunk/updateFilename`，仅更新 `file_name` 与 `update_time`。
- [x] 4.2 实现 `DELETE /admin/fileChunk/delete`：支持 `force` 参数；默认先删物理文件再删记录，`force=true` 允许强制清理记录。
- [x] 4.3 实现 `POST /admin/fileChunk/moveToSchool`：按 `type` 计算 `videos/documents` 二级目录目标路径并执行文件移动。
- [x] 4.4 在迁移前校验 `status=done`，迁移成功后更新 `target_path`、`school_id`、`update_time`，并处理不存在记录/不支持 type/源文件缺失异常。
- [x] 4.5 为更新、删除、迁移写操作增加角色数据域校验：`school_root/school_admin` 仅可操作所属学校记录。

## 5. Controller OpenAPI 与接口收口

- [x] 5.1 为 4 个管理端接口补齐 `@ApiTags`、`@ApiOperation`、`@ApiQuery`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth`。
- [x] 5.2 统一接口返回 `Result<T>` 结构，并补全成功/失败场景描述。
- [x] 5.3 对照 spec 手工走查参数与响应字段，确认与 OpenAPI 文档一致。

## 6. 实现后校验与交付

- [x] 6.1 执行 lint/编译，修复本次改动引入的类型与风格问题。
- [ ] 6.2 基于本地数据手动验证查询、重命名、删除、迁移四类接口的关键路径与异常路径（含 `force` 强制清理、跨校越权拦截、`status!=done` 迁移拦截）。
- [x] 6.3 更新必要注释与变更说明，确保后续 `/opsx:apply` 可直接按任务执行。
