## Context

当前 NestJS 后端已有完整的身份认证（JWT RS256）、角色权限（RBAC）、学校/课程模块。但缺乏文件存储层：用户头像、课程资料、视频等均无法持久化到磁盘。本设计基于本地磁盘存储，不依赖第三方 OSS，遵循现有代码规范（Result<T> 响应、@Role/@Public 装饰器、OpenAPI 3.0 注解）。

## Goals / Non-Goals

**Goals:**

- 统一管理磁盘目录结构，各业务维度（学校/课程/章节等）有独立的目录创建方法
- 小文件（图片 <5MB）一次性上传，返回访问相对路径
- 大文件分片上传：初始化 → 分片上传 → 查询进度 → 合并，支持断点续传
- 定时任务自动清理超时未合并的孤立分片（>24h）
- 分片元数据持久化到 MySQL（file_chunk 表），合并后清除分片记录

**Non-Goals:**

- 不支持第三方 OSS 存储
- 不实现文件预览/转码/压缩
- 不支持断点续下载

## Decisions

### 决策 1：文件命名选择 hash 而非业务 ID

- **结论**：最终存储的视频/文档等大文件使用 SHA-256 hash 命名（`{file_hash}.mp4`）
- **理由**：去重能力（相同文件同 hash 可共享）；避免业务 ID 枚举攻击；文件名不因业务属性变化失效
- **例外**：用户头像（`users/avatars/`）为一对一强覆盖场景，直接使用 `{user_id}.png`，便于定位和替换

### 决策 2：分片元数据存 MySQL 而非仅存 metadata.json

- **结论**：在数据库存储 file_chunk 记录，同时在分片目录保留 metadata.json 作为快速查询缓存
- **理由**：数据库支持按创建时间查询（定时清理）、事务保证合并操作的原子性；纯文件系统在高并发下易产生竞态

### 决策 3：分片上传不走业务目录模板

- **结论**：分片缓冲区固定为 `uploads/temp/chunks/{file_hash}/`，与业务目录完全隔离
- **理由**：合并前无法确定最终业务归属；简化分片生命周期管理；清理任务只需扫描 chunks 目录

### 决策 4：目录创建模板集中管理

- **结论**：在 `src/common/utils/file-path.map.ts` 中采用动态 Getter 获取根路径，并枚举所有目录路径模板。`StorageService` 为每个业务层级提供独立的 create 方法，统一接受 `string` 类型 ID（兼容 UUID）。
- **理由**：避免硬编码路径散落在各 service 中；确保环境变量加载顺序正确；支持分布式/随机 ID 体系。

### 决策 5：小文件上传使用 Multer 内存存储

- **结论**：小文件（<5MB 图片）使用 Multer memoryStorage，在 Service 层写入目标目录
- **理由**：图片需校验类型和大小，内存存储便于在写入前做 Buffer 级别校验；大小限制在拦截器层面即可拒绝

## API 设计概览

### 小文件上传
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/file/upload/image` | 上传图片（<5MB），返回存储路径 |

### 分片上传
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/file/chunk/init` | 初始化分片上传，返回 uploadId |
| POST | `/file/chunk/upload` | 上传单个分片（multipart） |
| GET  | `/file/chunk/progress/:fileHash` | 查询已上传的分片列表 |
| POST | `/file/chunk/merge` | 合并所有分片并移至目标路径 |

### 目录管理
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/file/storage/school` | 创建学校目录结构 |
| POST | `/file/storage/course` | 创建课程目录结构 |
| POST | `/file/storage/chapter-lesson` | 创建章节/课时目录 |
| POST | `/file/storage/homework` | 创建作业提交目录 |

## 模块结构

```
src/modules/file/
├── file.module.ts
├── file.controller.ts          # 路由聚合
├── upload/
│   ├── upload.service.ts       # 小文件写入磁盘
│   └── dto/upload-image.dto.ts
├── chunk/
│   ├── chunk.service.ts        # 分片上传逻辑
│   ├── chunk.entity.ts         # FileChunk TypeORM 实体
│   └── dto/
├── storage/
│   ├── storage.service.ts      # 目录创建模板方法
│   └── dto/
└── tasks/
    └── cleanup.task.ts         # @Cron 定时清理任务

src/common/utils/
└── file-path.map.ts            # 路径模板枚举
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 磁盘空间耗尽（大量临时分片） | 定时任务清理 + 设置分片最大数量限制 |
| 并发分片合并竞态 | 合并接口幂等：DB 记录状态字段（pending/merging/done） |
| 文件类型伪造（改后缀上传） | 使用 file-type 库检测实际 MIME 类型（可选增强） |
| 分片上传中途服务重启 | 元数据持久化在 MySQL，重启后可恢复进度 |
| 路径穿越攻击 | 所有路径使用 path.join 拼接，严格校验文件名不含 `..` |
