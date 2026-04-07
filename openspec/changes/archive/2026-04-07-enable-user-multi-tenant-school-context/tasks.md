## 1. 数据模型与迁移

- [x] 1.1 新建 `user_school_identity` 实体（含 `id/user_id/school_id/actor_type/actor_id/status/create_time/update_time`）并补齐 Swagger `@ApiProperty` 注解
- [x] 1.2 在 `src/modules/common/common/common.module.ts` 的 entities 常量中注册 `UserSchoolIdentity` 实体
- [x] 1.3 编写并执行建表 SQL：创建 `user_school_identity` 及索引 `uk_user_school_actor`、`idx_user_school`、`idx_actor`
- [x] 1.4 编写数据回填脚本：从 `teacher`、`student` 表初始化写入 `user_school_identity`
- [x] 1.5 为回填脚本增加幂等保护（重复执行不产生重复记录）

## 2. Auth 两阶段令牌改造

- [x] 2.1 扩展 `TokenPayloadDto`：新增 `tokenType`、`schoolId`、`actorType`、`actorId`、`selectableSchoolIds`
- [x] 2.2 新增认证请求 DTO：`SelectSchoolDto`、`SwitchSchoolDto`，并使用 class-validator（`@IsString`、`@IsNotEmpty`）与 Swagger `@ApiProperty`
- [x] 2.3 新增认证响应 DTO：`PendingLoginResponseDto`、`SelectSchoolResponseDto`、`SwitchSchoolResponseDto`（声明 OpenAPI 3.0 字段）
- [x] 2.4 在 `AuthService` 实现 `login` 改造：返回 `pendingToken + schools`
- [x] 2.5 在 `AuthService` 实现 `selectSchool`：校验学校归属并签发含 `schoolId` 的业务 token
- [x] 2.6 在 `AuthService` 实现 `switchSchool`：校验可切换范围并换发新 token
- [x] 2.7 在 `AuthService` 实现 `listSelectableSchools`：从 `user_school_identity` 聚合 `schoolId/schoolName/actorType/actorId`
- [x] 2.8 在 `AuthController` 新增 `POST /auth/selectSchool`、`POST /auth/switchSchool`、`GET /auth/schools`
- [x] 2.9 更新 `POST /auth/login` 与 `POST /auth/jwtAuth` 的响应契约和 Swagger 注解

## 3. ALS 与 Guard 上下文改造

- [x] 3.1 扩展 `RequestContext` 类型：新增 `schoolId`、`actorType`、`actorId`，并将 `roleIds` 统一为 `string[]`
- [x] 3.2 在 `AsyncLocalstorageService` 新增 getter：`getSchoolId()`、`getActorId()`、`getActorType()`
- [x] 3.3 改造 `AuthGuard`：用户端 token 验证后写入 `userId/roleIds/schoolId/actorType/actorId`
- [x] 3.4 在 `AuthGuard` 增加 pending token 访问控制（仅允许选校相关接口）
- [x] 3.5 保持 `@AdminAuth()` 与管理员 token 验证逻辑不变并加注释说明

## 4. 用户端本人接口去参改造

- [x] 4.1 改造 `ListTeacherCoursesQueryDto`：移除 `teacher_id`、`school_id` 必填契约，仅保留分页参数并更新 Swagger
- [x] 4.2 改造 `ListStudentCoursesQueryDto`：移除 `student_id`、`school_id` 必填契约，仅保留分页参数并更新 Swagger
- [x] 4.3 改造 `SyncProgressDto`：移除 `schoolId` 字段并更新 class-validator 与 Swagger
- [x] 4.4 改造 `GetCourseLearningProgressDto`：移除 `schoolId` 字段并更新 class-validator 与 Swagger
- [x] 4.5 改造 `CourseService.listTeacherCoursesUser`：使用 ALS 的 `actorId + schoolId` 查询
- [x] 4.6 改造 `CourseService.listStudentCoursesUser`：使用 ALS 的 `actorId + schoolId` 查询
- [x] 4.7 改造 `CourseService.syncLearningProgress`：使用 ALS 的 `schoolId` 校验学生归属
- [x] 4.8 改造 `CourseService.getCourseLearningProgress`：使用 ALS 的 `schoolId` 做权限过滤
- [x] 4.9 排查并替换用户端其他本人接口中对 `school_id/teacher_id/student_id` 的授权依赖

## 5. 控制器文档与兼容收口

- [x] 5.1 为新增认证接口补齐 `@ApiTags`、`@ApiOperation`、`@ApiResponse`、`@ApiBearerAuth`
- [x] 5.2 为已改造课程接口更新 Swagger 文档，删除已废弃参数说明
- [x] 5.3 在兼容期对旧身份参数采用“可选且忽略”策略，并统一返回提示信息
- [x] 5.4 补充迁移与发布说明文档：回填执行顺序、灰度策略、回滚步骤
- [x] 5.5 执行 openspec 状态检查，确认 `tasks` 产物完成并可进入 `/opsx:apply`
