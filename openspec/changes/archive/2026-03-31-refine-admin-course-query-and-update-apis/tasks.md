## 1. DTO 与 OpenAPI 模型调整

- [x] 1.1 更新 CourseAdmin.dto.ts：从 UpdateCourseDto 移除 description，仅保留 id、name、cover_img、status 并保持 class-validator 规则。
- [x] 1.2 更新 CourseListItemDto：移除 chapter_count、total_lesson_count，新增 school_name 字段并补齐 Swagger @ApiProperty 描述。
- [x] 1.3 新增单课程基础信息响应 DTO（如 CourseBasicResponseDto），覆盖课程字段（不含 description）与 school_name、creator_name、teacher_names，并完善 Swagger 注解。

## 2. Service 查询与更新逻辑收敛

- [x] 2.1 重构 listCourseAdmin：去除章节/课时聚合 SQL，补充 school_name 查询与结果映射。
- [x] 2.2 新增 getCourseBasicAdmin(id) 服务方法：复用权限校验，返回课程基础字段（不含 description）及 school_name、creator_name、teacher_names。
- [x] 2.3 收敛 updateCourseAdmin 字段写入逻辑，仅处理 name、cover_img、status，确保 description 不可通过该接口更新。

## 3. Controller 路由与 Swagger 注解更新

- [x] 3.1 在 CourseController 新增 GET /course/getCourseBasicAdmin/:id 路由，接入 @AdminAuth、@Role(...AdminRoles) 与对应 @ApiOperation/@ApiResponse。
- [x] 3.2 更新 listCourseAdmin 的 @ApiResponse 类型映射，确保 Swagger 展示移除计数字段并包含 school_name。
- [x] 3.3 更新 updateCourseAdmin 的 Swagger 请求体说明，确保文档只暴露允许更新字段。

## 4. 自检与状态确认

- [x] 4.1 本地运行 lint/编译检查，修复与本变更直接相关的类型与装饰器问题。
- [x] 4.2 执行 openspec status --change "refine-admin-course-query-and-update-apis"，确认变更达到可 apply 状态。
