## 1. DTO 与参数层重构

- [x] 1.1 创建或更新上传场景枚举 `FileUploadScenario`，包含 `avatar`、`school_resource`、`course_homework`。
- [x] 1.2 创建带详细 `@ApiProperty` 装饰器及 `class-validator` 验证规则的 `UploadChunkDto`（包含 `scenario`、`schoolId`、`courseId`、`homeworkId` 等业务上下文参数）。
- [x] 1.3 创建带详细 `@ApiProperty` 装饰器及验证规则的 `MergeChunkDto`用于切片的最终合并路径计算。

## 2. API 接口的 Swagger 补充

- [x] 2.1 重构 `FileUploadController` 类上的 `@ApiTags()` 声明及相关描述。
- [x] 2.2 重构分片上传接口 `uploadChunk`，完善入参说明和 `@ApiOperation()` 标记。
- [x] 2.3 重构文件合并接口 `merge`，补充所需的新 DTO 注入及 `@ApiOperation()` 标记。
- [x] 2.4 添加缺失的错误响应类型声明（如 `@ApiResponse({ status: 400 })`）以符合 Swagger。

## 3. 核心服务：路径解析与合并

- [x] 3.1 在 `FileUploadService` 新增 `resolveBusinessStoragePath(dto)` 核心方法，根据不同的 `scenario` 输出基于业务的租户隔离映射地址。
- [x] 3.2 保持 `temp/chunks` 切片上传时不受影响的目录，并确保目录存在 (`fs.mkdirSync` 级联建立)。
- [x] 3.3 重构 `mergeChunk` 业务：在流式拼接合并文件结束后，调用 `resolveBusinessStoragePath`，应用 `fs.rename` (或移动)把最终文件迁移至目标资源库或课程作业库。
- [x] 3.4 修改在单文件直传中生成最终存盘目录的依赖注入逻辑，接入 `resolveBusinessStoragePath`。

