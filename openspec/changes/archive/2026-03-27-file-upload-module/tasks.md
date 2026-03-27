## 1. 基础设施与依赖安装

- [x] 1.1 安装依赖包：`@nestjs/schedule`、`cron`、`multer`、`@types/multer`
- [x] 1.2 在 `AppModule` 中注册 `ScheduleModule.forRoot()`
- [x] 1.3 创建 `src/common/utils/file-path.map.ts`，定义文件存储根路径常量和各业务目录路径模板枚举

## 2. FileChunk 实体与数据库

- [x] 2.1 查询 MySQL 现有表结构，确认 `file_chunk` 表是否存在，设计字段（id、file_hash、file_name、file_size、total_chunks、uploaded_chunks JSON、status、target_path、create_time、update_time）
- [x] 2.2 创建 `src/modules/file/chunk/chunk.entity.ts`，使用 TypeORM 装饰器，字段含 `@ApiProperty`
- [x] 2.3 在 `src/modules/common/common.module.ts` 的 `entities` 数组中注册 `FileChunk` 实体

## 3. 文件模块骨架

- [x] 3.1 创建 `src/modules/file/file.module.ts`，声明 providers（UploadService、ChunkService、StorageService、CleanupTask）和 controllers
- [x] 3.2 创建 `src/modules/file/file.controller.ts`，添加 `@ApiTags('文件管理')`、`@ApiBearerAuth()` 装饰器
- [x] 3.3 在 `src/app.module.ts` 中导入 `FileModule`

## 4. 磁盘目录管理（StorageService）

- [x] 4.1 创建 `src/modules/file/storage/dto/create-school-dir.dto.ts`，含 `schoolId`，添加 `@ApiProperty` 和 class-validator 装饰器
- [x] 4.2 创建 `src/modules/file/storage/dto/create-course-dir.dto.ts`，含 `schoolId`、`courseId`
- [x] 4.3 创建 `src/modules/file/storage/dto/create-chapter-lesson-dir.dto.ts`，含 `schoolId`、`courseId`、`chapterId`、`lessonId`
- [x] 4.4 创建 `src/modules/file/storage/dto/create-homework-dir.dto.ts`，含 `schoolId`、`courseId`、`homeworkId`、`submitId`
- [x] 4.5 创建 `src/modules/file/storage/storage.service.ts`，实现 `createSchoolDir()`、`createCourseDir()`、`createChapterLessonDir()`、`createHomeworkDir()` 四个方法，使用 `fs.mkdirSync({ recursive: true })`，路径通过 `file-path.map.ts` 模板生成
- [x] 4.6 在 `file.controller.ts` 中添加 4 个目录创建路由（POST /file/storage/school 等），添加 `@ApiOperation`、`@ApiResponse`、`@Role()` 装饰器

## 5. 小文件上传（UploadService）

- [x] 5.1 创建 `src/modules/file/upload/dto/upload-image.dto.ts`（含 `target` 字段，`@ApiProperty`）
- [x] 5.2 创建 `src/modules/file/upload/upload.service.ts`，实现 `saveImage()` 方法：校验 MIME 类型和大小（>5MB 抛 PayloadTooLargeException），生成文件名（hash 命名），写入磁盘，返回相对路径
- [x] 5.3 在 `file.controller.ts` 添加 POST `/file/upload/image` 路由，使用 `@UseInterceptors(FileInterceptor('file'))` 和 `@UploadedFile()`，添加 `@ApiConsumes('multipart/form-data')`、`@ApiOperation`、`@ApiResponse`

## 6. 分片上传（ChunkService）

- [x] 6.1 创建 `src/modules/file/chunk/dto/init-chunk.dto.ts`，含 `fileHash`、`fileName`、`fileSize`、`totalChunks`，添加 `@ApiProperty` 和校验装饰器
- [x] 6.2 创建 `src/modules/file/chunk/dto/upload-chunk.dto.ts`，含 `uploadId`、`chunkIndex`
- [x] 6.3 创建 `src/modules/file/chunk/dto/merge-chunk.dto.ts`，含 `uploadId`、`fileHash`、`targetPath`
- [x] 6.4 创建 `src/modules/file/chunk/chunk.service.ts`，实现 `initUpload()` 方法：查找同 fileHash 的 pending 记录（断点续传）或创建新记录，写入 metadata.json，返回 uploadId 和已上传分片列表
- [x] 6.5 在 `chunk.service.ts` 中实现 `uploadChunk()` 方法：验证 uploadId 存在，将分片 Buffer 写入 `uploads/temp/chunks/{fileHash}/{chunkIndex}`，更新 DB 的 uploaded_chunks JSON 字段和 update_time
- [x] 6.6 在 `chunk.service.ts` 中实现 `getProgress()` 方法：按 fileHash 查询 DB 记录，返回 status、uploadedChunks、totalChunks
- [x] 6.7 在 `chunk.service.ts` 中实现 `mergeChunks()` 方法：校验分片完整性，按序读取并合并写入 targetPath，更新 DB 状态为 done，删除 chunks 临时目录，幂等处理（status=done 时直接返回已有路径）
- [x] 6.8 在 `file.controller.ts` 添加 4 个分片上传路由（POST init、POST upload、GET progress、POST merge），添加 `@ApiOperation`、`@ApiResponse`、`@ApiConsumes`（upload 接口）装饰器

## 7. 定时清理任务（CleanupTask）

- [x] 7.1 创建 `src/modules/file/tasks/cleanup.task.ts`，使用 `@Injectable()`，注入 `ChunkService` 或直接注入 `FileChunk` Repository
- [x] 7.2 在 `cleanup.task.ts` 中实现 `cleanExpiredChunks()` 方法：查询 status=pending 且 create_time < (now - CHUNK_EXPIRE_HOURS)h 的记录，逐条删除磁盘目录并更新 DB 状态为 expired，记录日志
- [x] 7.3 为 `cleanExpiredChunks()` 添加 `@Cron()` 装饰器（从环境变量 `CHUNK_CLEANUP_CRON` 读取，默认 `'0 2 * * *'`）
- [x] 7.4 在 `file.controller.ts` 添加 POST `/file/chunk/cleanup` 手动触发接口，添加 `@Role('admin', 'root')`、`@ApiOperation`、`@ApiResponse` 装饰器

## 8. Swagger 完善与最终检查

- [x] 8.1 确认所有新增 DTO 的每个字段均有 `@ApiProperty()`（含 description、example）
- [x] 8.2 确认所有新增 Controller 路由均有 `@ApiOperation({ summary })`、`@ApiResponse({ status, description })`
- [x] 8.3 确认所有需要权限的接口有 `@Role()` 或 `@AdminAuth()` 装饰器，公开接口有 `@Public()`
- [x] 8.4 确认 `create_time`、`update_time` 字段在创建/更新操作中均以秒级时间戳（string）写入
