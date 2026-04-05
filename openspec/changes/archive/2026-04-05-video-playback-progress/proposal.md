## 为什么 (Why)

当前课程的课时关联了本地视频路径（`course_lesson.video_path`），但用户端尚未具备流畅播放视频和记录学习情况的能力。如果不进行切片传输，视频需要完整下载才能播放，体验极差；同时，缺少学生的学习进度打点，老师无法统计学生的课程参与情况和完课率。因此我们需要实现一套视频流媒体播放及进度记录机制。

## 目标 (Goals)
- 允许具备权限的学生用户端，通过特定的 URL 访问本地服务器上的视频资源。
- **(变更)** 借助现有的 Nginx `mp4` 和 `Accept-Ranges` 相关配置，直接在代理层实现视频资源的切片（流式传输/Chunked Transfer/HTTP Range Requests）下发，避免在 Node.js 侧消耗 I/O。
- 周期性记录学生的视频观看进度和学习情况，并在达到特定条件时自动标记课时为已完成。
- 提供合理的前后端配合机制（如：前端播放器携带鉴权，并在特定事件与后端心跳上报）。

## 非目标 (Non-goals)
- 本次改动不涉及复杂的视频转码或加密（如 m3u8/HLS 与 DRM），初期仅依赖原视频文件的 Nginx 切片流分发。
- 不处理直播拉流推送等场景。

## 改动内容 (What Changes)

- **[REMOVED] 后端视频切片接口**: 取消由 Node.js 处理 `fs.createReadStream` 及 `206 Partial Content`，转而完全交给配置好 `mp4` 及 `Accept-Ranges` 的 Nginx 进行路由。
- **[MODIFIED] 静态资源鉴权接口**: 修改现有的 `GET /api/auth/checkFilePermission`。因为原生的 `<video>` 不支持自定义带有 `Authorization: Bearer xxx` 的请求头，我们需要允许该鉴权接口通过解析 URL 参数中的 Query 获取并验证 `token`。（利用 Nginx 传过来的 `x-original-uri` 包含的参数）。
- **[ADDED] 进度收集与更新接口**: 新增 API 根据前端定期回调/心跳同步观看进度，处理数据写库。
- **数据表关联使用**:
  - `course_lesson`: 保持原本从业务层可获取的 `video_path`，需保证转换成 Nginx 可访问的静态路由地址给前端。
  - `course_learning_record`: 更新/生成对应实体记录，生成包含 `student_id`, `course_id`, `chapter_id`, `lesson_id`, `progress_percent`, `is_completed` 的条目。
- **前端配合方案**:
  - `<video src="https://(domain)/fileStore/schools/xxx.mp4?token=xxxx">`，前端需要主动拼接合法的 Jwt Token 给 URL，满足反代鉴权需求。
  - 前端监听 `<video>` 的 `timeupdate` 和 `ended` 事件进行防抖/节流请求调用后端的 `POST /course/sync-progress` 。

## Capabilities

### New Capabilities
- `video-streaming`: 基于 Nginx 静态文件模块与 URL JWT 参数注入的适配流媒体鉴权传输能力。
- `learning-progress-sync`: 学生学习记录与课时进度心跳上报机制。

### Modified Capabilities


## 影响范围 (Impact)

- **API 接口**: 
  - 修改 `GET /auth/checkFilePermission`，提取 `token` 的途径新增 `req.headers['x-original-uri']` 解析，匹配兼容音视频 URL Query 携带 Auth。
  - 新增 `POST /course/sync-progress`。
- **代码层**: 影响 `auth.controller.ts`，新增内容放到 `course.controller.ts` 和 `course.service.ts` 或独立的 `learning-record` 模块。
