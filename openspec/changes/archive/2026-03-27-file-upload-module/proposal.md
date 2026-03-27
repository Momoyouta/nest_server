## Why

当前系统缺少文件存储与管理能力，无法支撑课程资料上传、学生作业提交、用户头像上传等核心业务场景。需要构建一套统一的文件管理模块，同时兼顾小文件（<5MB 图片）的快速上传和大文件（mp4/pdf/word/txt）的可靠分片上传。

## 目标 (Goals)

- 提供小文件直传接口（图片 <5MB）
- 提供大文件分片上传接口（支持断点续传，适用于 mp4/pdf/word/txt 等学习资料）
- 按业务语义管理磁盘目录结构（学校/课程/章节/课时/作业等层级）
- 提供可配置的定时任务，自动清理过期的孤立分片文件
- 支持 Nginx auth_request 机制进行私有文件访问权限校验

## 非目标 (Non-goals)

- 不提供文件预览/转码/压缩等媒体处理能力
- 不对接第三方 OSS（阿里云/腾讯云等），全部存储在本地磁盘
- 不实现文件下载限速、断点续下载

## What Changes

- **[NEW]** `src/modules/file/` — 文件模块，包含 controller、service、dto、entity
- **[NEW]** `src/modules/file/upload/` — 小文件上传子服务（multer）
- **[NEW]** `src/modules/file/chunk/` — 大文件分片上传子服务（分片接收、合并、进度查询）
- **[NEW]** `src/modules/file/storage/` — 磁盘目录结构管理服务（根据业务 ID 创建目录）
- **[NEW]** `src/modules/file/tasks/` — 定时清理任务（@nestjs/schedule）
- **[NEW]** `src/common/utils/file-path.map.ts` — 目录路径模板枚举，统一管理各层级路径规则
- **[MODIFY]** `src/modules/common/common.module.ts` — 注册新实体（FileChunk）
- **[MODIFY]** `src/app.module.ts` — 注册 FileModule、ScheduleModule

## Capabilities

### New Capabilities

- `small-file-upload`：小文件（图片 <5MB）上传能力，返回可访问 URL
- `chunked-upload`：大文件分片上传能力，包含初始化、分片上传、合并、进度查询四个阶段
- `storage-directory`：磁盘目录结构管理，按业务模板（school/course/chapter/lesson/homework）创建层级目录
- `chunk-cleanup-task`：定时任务，按创建时间清理过期孤立分片（默认 >24h 的未合并分片）

### Modified Capabilities

（无已有规格文件需变更）

## Impact

**涉及代码/API：**
- 新增约 8+ 个 REST 接口（OpenAPI 3.0 标注）
- 新增 1 个 TypeORM 实体（`file_chunk` 表）
- 新增 1 个定时任务（Cron 表达式可配置）

**依赖库：**
- `multer` / `@types/multer` — 文件上传中间件（NestJS 内置支持）
- `@nestjs/schedule` + `cron` — 定时任务（Cron Job）
- `uuid` / `crypto`（Node 内置）— 生成文件 hash

**文件命名策略分析：**
> 对于存储文件的命名，推荐使用 **hash 命名（file_hash.ext）** 而非业务 ID 命名（school_id.ext），理由如下：
> - **去重**：相同内容文件可共享存储，节省磁盘空间
> - **安全**：避免通过 URL 枚举业务 ID 猜测文件路径
> - **稳定**：文件 hash 不随业务属性（如 school_id 变更）而失效
> - **例外**：`user_id.png` 这类一对一强关联且需覆盖写的头像文件，可直接用 user_id 命名，便于直接定位和替换

**路径解析实现：**
为了确保在 NestJS 加载环境变量后正确读取配置，`FILE_STORE_ROOT` 采用了动态 Getter 模式，所有路径解析（`resolvePath`）均在运行时动态读取 `process.env.FILE_STORE_BASE_PATH`。

**磁盘目录结构：**
```
E:\fileStore
├── schools\{school_id}\avatars\
├── schools\{school_id}\materials\
├── schools\{school_id}\publicMaterials\
├── schools\{school_id}\courses\{course_id}\materials\
├── schools\{school_id}\courses\{course_id}\chapters\{chapter_id}\lessons\{lesson_id}\
├── schools\{school_id}\courses\{course_id}\homework\{homework_id}\{submit_id}\
├── users\avatars\
└── uploads\temp\chunks\{file_hash}\
```
各 `{key}` 层级由对应的目录模板方法创建（如 `createSchoolDir(schoolId)`），所有 ID 参数均为 `string` 类型（支持 UUID）。分片上传缓冲区（`uploads/temp/chunks/`）不受业务目录模板约束。
