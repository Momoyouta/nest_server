## Why

随着系统业务的扩展，原有的文件上传模块存储结构无法满足按“学校-课程-作业”等多维度进行租户隔离和业务绑定的需求。为了实现更精细化的文件存储和权限管理（如将校本资源与动态数据分离、学生作业不可共享等），特提出本次重构方案，以便支持未来复杂的文件管理与离线批量导入。

## Goals 
- 基于最新的业务模型（学校根目录隔离、校本资源库、课程数据分离、全局用户头像分离）重构文件存储目录结构。
- 保证切片上传（chunk）和临时文件（temp）的逻辑在新的目录下依然适用并支持现有前端单次上传。
- 增加业务上下文参数，支持不同层级的动态保存路径解析。

## Non-goals
- 不修改原有的文件切片合并算法以及大文件分片传输协议。
- 不涉及文件格式校验极速、配额管理及上传速度等性能优化。
- 暂不修改文件访问鉴权模块（Nginx Auth / checkFilePermission 等接口保持原样）。

## What Changes

- **存储结构变更**：由原来扁平化的存储升级为按业务组织的层级化存储（例如 `schools/{school_id}/resource_library/...` 或 `users/avatars/`）。
- **静态资源划分**：提取校本资源统一管理，并将学生作业等动态产生的不可共享数据严格与课程 `courses/{course_id}/` 绑定。
- **API 接口扩展**：现有的 OpenAPI 3.0 上传接口需支持额外的 Body 参数（如 `school_id`, `course_id`, `homework_id`），例如扩展 `POST /upload` 和合并接口 `POST /upload/merge`，确保 Swagger 上的定义更新。

## Capabilities

### New Capabilities
- `tenant-file-isolation`: 基于学校 ID 和业务模块的租户级文件隔离与路径路由能力。
- `school-resource-library`: 校本资源库管理相关接口说明。

### Modified Capabilities
- `file-chunk-upload`: 分片上传与合并的最终存储路径解析规则因需支持多级业务目录而改变。

## Impact

- 影响 `FileUploadController` 及 `FileUploadService` 内部目录持久化相关的业务代码。
- 现有涉及静态文件访问的实体库路径、数据库存放路径以及返回前端的 URL 需要适配新的存储路由。
