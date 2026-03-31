## Context
随着平台功能拓展至更细粒度的学校级管理与课程管理，原有的文件上传模块（所有文件统一堆放在 `uploads` 临时目录或由简单的 Hash 扁平化分布）已无法满足业务需求。当前需要将存储结构变更为基于业务逻辑和租户隔离的目录拓扑（如：`schools/{school_id}/resource_library/...`、`courses/{course_id}/homework/...` 等）。

## Goals / Non-Goals
**Goals:**
- 提供支持分级目录（如 {school_id}、{course_id}）挂载的文件上传和合并解析逻辑。
- 设计新的上传接口 DTO 及 OpenAPI 3.0 Swagger 规范，适配动态存储路径所需参数。

**Non-Goals:**
- 不涉及大文件分片文件的 MD5 加密或上传速度优化。
- 不实现已有旧结构文件的自动化清洗和物理迁移，旧文件维持原样，仅支持增量新结构。

## Decisions

### 1. DTO 与接口规范改动
通过引入 `FileUploadScenario` 枚举来控制上传子目录映射和最终存储落地位置，重构 `FileUploadService` 生成路径的核心逻辑。

**OpenAPI 3.0 新规范定义**:
- **POST `/upload` 或 `/upload/chunk` (分片上传)**
  - **Auth**: 需要 JWT (`Bearer`) -> `@Role(...)` 取决于模块，默认通用登录即可，作业需要学生/教师。
  - **请求体 (multipart/form-data)**: 
    - `file`: `string($binary)` - 选填文件
    - `scenario`: `enum['avatar', 'school_resource', 'course_homework']` - 【必需】上传场景
    - `schoolId`: `number` - 学校ID，配合校本资源必填
    - `courseId`: `number` - 课程ID，配合课程作业必填
    - `homeworkId`: `number` - 作业ID，配合学生作业必填
    - `fileHash`: `string` - 【必需】文件 Hash 防重与断点续传标示
    - `chunkIndex`: `number` - 当前切片序号
  - **响应结果**: `Result<{ chunkList?: string[], success: boolean }>`

- **POST `/upload/merge` (分片合并)**
  - **请求体 (application/json)**:
    - 类似上述业务参数，重点带有 `fileHash`、`scenario`、`fileName` 及对应层级 ID，以便在底层文件服务中将 `uploads/temp/chunks/{hash}` 转移到 `fileStore/...`。
  - **响应结果**: `Result<{ url: string, path: string }>`

### 2. TypeORM 实体影响
当前 `fileStore` 返回的是基于业务挂载的相对路径。路径会被存入实际使用的业务表（如 `HomeworkSubmit` 表、`User` 实体、`ChapterResource` 实体等）的 URL 字段或特定字段。数据库内不维护单独的文件字典总表，因此无直接实体变更，仅涉及业务外键关联字段存入值的格式变为更标准的 `/fileStore/schools/xxx`。

## Risks / Trade-offs
**Risk**: 接口兼容性
当前前端如果有依赖纯 hash 扁平化上传逻辑的代码会产生断裂。
**Mitigation**: 前端发版时必需同步提供 `scenario` 及业务 ID 等参数；如果在过渡期，可以设定一个 default `legacy_temp` 目录收口老版本的上传请求。
