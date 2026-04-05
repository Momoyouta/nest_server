## 1. 基础配置与实体结构检查

- [x] 1.1 检查并确保 TypeORM 的 `CourseLearningRecord` 实体正确定义了 `progress_percent`, `learn_count`, `is_completed` 等现有字段。

## 2. 定义 DTO 与 Swagger 规范

- [x] 2.1 创建 `SyncProgressDto`在 `src/modules/course/dto/sync-progress.dto.ts`，使用 class-validator 添加 `@IsString()`, `@IsNumber()` 等基础校验。
- [x] 2.2 给 `SyncProgressDto` 增加 `@ApiProperty` 装饰器，添加 Swagger 文档注释说明字段属性（`courseId`, `chapterId`, `lessonId`, `progress_percent`）。

## 3. 实现 Nginx 静态文件防盗鉴权支持 (Controller 修改)

- [x] 3.1 修改 `src/modules/auth/auth.controller.ts` 的 `checkFilePermission` 方法逻辑。引入针对 `@Headers('x-original-uri') originalUri` 参数。
- [x] 3.2 增加 URL 尝试解析逻辑：若标准 `Token` 不存在，利用内置机制诸如 `new URL() ` / `URLSearchParams` 提取 `originalUri` 中的 `token` 值进行鉴权回执。

## 4. 实现 Core 业务进度同步逻辑 (Service & Controller)

- [x] 4.1 在 `CourseService` 中编写 `syncLearningProgress(studentId, dto: SyncProgressDto)` 方法，查询 `course_learning_record` 是否存在历史记录。
- [x] 4.2 完善 `syncLearningProgress` 逻辑：如果存在记录且属于有效进步，更新 `last_learn_time` 和 `progress_percent`，当 `progress_percent >= 90` 时设置 `is_completed: true`；若不存在记录则执行插入。
- [x] 4.3 在 `CourseController` 定义 `POST /sync-progress` 接口，注入 `@JwtAuth()` 守卫拦截出此请求的 `student_id`，并使用新建的 `SyncProgressDto` 解析 Body 参数。
- [x] 4.4 在 `CourseController` 给同步接口补充 Swagger 相关注解 `@ApiOperation` 和 `@ApiResponse` 告知返回结构格式。

## 5. 联调检查与前端验证测试配合

- [x] 5.1 本地调取 Postman 验证 /sync-progress 逻辑与数据库落库行为。
- [x] 5.2 确定前端通过添加 `?token=jwt_xx` 能够无缝访问 nginx 下挂载在 `E:/毕设/study_platform_frontend/nginx.conf` （/fileStore/schools/*）的对应视频路由。
