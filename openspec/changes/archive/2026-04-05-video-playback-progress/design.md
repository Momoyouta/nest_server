## Context

目前，课程系统中的 `course_lesson` 拥有 `video_path`。由于 Nginx 配置文件 `nginx.conf` 经已配妥针对 `/fileStore/schools/` 的 `auth_request` 内部鉴权拦截、 `mp4` 与 `Accept-Ranges bytes` 参数。这说明系统已具备在基础设施层处理视频切分的能力。但是，现有的 `GET /api/auth/checkFilePermission` 鉴权接口只监听并在 `@Headers('authorization')` 寻找 Token，而原生的 HTML5 `<video src="url">` 标签无法自定义添加 Header 携带 JWT Token 进行凭证校验。此外，我们还需要新增 `course_learning_record` 模块用以收敛并统计学生的在线观看进度与完课情况。

## Goals / Non-Goals

**Goals:**
- **视频流化访问授权**: 适配前端 `<video>` 无法添加 Header 的特定属性，重构 `checkFilePermission`，使其能从回调的请求源 URL 参数（Query String）中提取 `token` 用于鉴权，进而完全复用 Nginx 强大的 I/O 与传输能力（释放 NestJS 压力）。
- 提供进度同步 API 定期更新写入学生的完课状态。
- 数据闭环与权限隔离得到保障。

**Non-Goals:**
- 不再在 NestJS 中手动监听及处理 `fs.createReadStream`（摒弃应用层视频处理）。
- 不引入第三方外部云存储服务或视频转流引擎。

## Decisions

### 1. Nginx 鉴权打通 (Nginx auth_request Adapter)
**Rationale（理论依据）：**
原生的 `<video src="url">` 获取静态资源不能像 Ajax 那样指定 `Header`。Nginx 会把原请求 URL 保存到 `X-Original-URI` 这个 Header（由现在的 nginx 代理配置注入）传给后端的鉴权中心 `checkFilePermission`。
**Decision：**
修改现有的 `checkFilePermission` 逻辑，在没有获取到标准的 `Authorization: Bearer xxx` 时，自动解析并拿取 `X-Original-URI` 内嵌的 Query Params (`?token=xxx`)。一旦提取到，便调用现有的 `this.authService.validateTokenForFile(token)` 完成 Nginx 对该文件的路由放行放行。

### 2. 进度同步 (Learning Progress Sync) 接口设计
**Rationale（理论依据）：**
前端播放过程中需要记录进度，通过发送特定心跳实现断点续考及完成度的监测。
**Decision：**
新增 `POST /course/sync-progress` 接口，接收当前时间戳等信息，UPSERT 至表 `course_learning_record`。如果 `progress_percent >= 90`，自动更新为 `is_completed: true` 参数。

### 3. API OpenAPI 设计 (Swagger)

#### API 1: 适配视频鉴权 (CheckFilePermission) (Modified)
- **Method**: `GET`
- **Path**: `/auth/checkFilePermission`
- **Params/Headers**: 监听 `authorization` 以及 `x-original-uri`。
- **Logic**: 新增从 URL 中解析 `?token=xxx` 的代码。
- **Response**: 返回 `200 OK` 或者 `401 Unauthorized`。

#### API 2: 进度心跳同步接口 (New)
- **Method**: `POST`
- **Path**: `/course/sync-progress`
- **Body**: 
  - `courseId` (String)
  - `chapterId` (String)
  - `lessonId` (String)
  - `progress_percent` (Number, 0-100)
- **Response**: `Result<null>` (200 OK)
- **Auth**: 标准 `@JwtAuth()` 解析 Bearer Token 获取 `student_id`。

### 4. 数据库 TypeORM 实体变更 (Entity Adjustments)
- 修改并明确 `CourseLearningRecord` 数据写入：
  - 更新 `progress_percent`。
  - 更新 `last_learn_time` 为当前时间。
  - 当条件触发设置 `is_completed = true`。 

## Risks / Trade-offs

- [Risk] Nginx `X-Original-URI` 提取规则如果不严谨可能受到某些特殊字符影响 -> Mitigation: Node 侧使用标准模块 `new URL(requestUri, 'http://localhost').searchParams` 去稳健抓取 query，而不用手工正则提取。
