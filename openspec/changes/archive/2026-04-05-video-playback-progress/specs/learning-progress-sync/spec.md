## ADDED Requirements

### Requirement: 学习进度心跳同步 API
必须提供一个 OpenAPI 3.0 规范的 `POST /course/sync-progress` 接口，允许前端周期性地同步课时播放进度。需要使用标准全局 `@JwtAuth()` 并使用 class-validator 严格校验请求主体中的字段（DTO）。接收到心跳请求后，后端必须更新或插入 `course_learning_record` 记录。

#### Scenario: 首次发送进度记录
- **WHEN** 学生第一次观看课时，并发送包含 `courseId`, `chapterId`, `lessonId` 及 `progress_percent=10` 的请求
- **THEN** 后端在 `course_learning_record` 表创建一个新记录，记录学号与该课时的对应进度和最后播放时间戳，并返回 200 OK，包含标准的 `Result` 结构。

#### Scenario: 更新已有的进度且未达成完课条件
- **WHEN** 该学生之前已有该课时的记录（如 `progress_percent=30`），本次报告为 `progress_percent=50`
- **THEN** 后端更新原记录的 `progress_percent` 为 50，修改 `last_learn_time`，不改变 `is_completed` (仍为 false)。

#### Scenario: 发送进度触发完课阈值
- **WHEN** 该学生已有记录，本次报告的 `progress_percent` 大于等于 `90`
- **THEN** 后端不仅更新 `progress_percent`，同时必须将 `is_completed` 标记设为 `true` (如果原先是 false，且 `learn_count` 可以增加)。

#### Scenario: 请求缺少必填参数
- **WHEN** 请求 Body 中缺少 `lessonId` 或者 `progress_percent`
- **THEN** class-validator 阻拦请求并由后端抛出 BadRequestException，返回带有验证错误详情的 `Result`。
