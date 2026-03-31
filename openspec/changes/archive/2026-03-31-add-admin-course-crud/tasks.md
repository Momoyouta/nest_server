## 1. 模块与数据访问准备

- [x] 1.1 在 src/modules 下创建/补全 course 模块基础结构（controller、service、dto），并在 app/common 模块中完成依赖注册。
- [x] 1.2 在课程服务中注入 course、course_chapter、course_lesson、course_teacher、teacher、user、school_admin 等仓储，补齐 ALS 用户上下文读取能力。
- [x] 1.3 梳理并复用课程状态与角色映射（course.map.ts、role.map.ts），明确平台管理员与学校管理员判定逻辑。

## 2. DTO 与 OpenAPI 契约

- [x] 2.1 新增 CreateCourseDto、UpdateCourseDto、CourseListQueryDto、CourseDeleteParamDto，并为字段添加 class-validator 规则与 Swagger @ApiProperty/@ApiPropertyOptional 注解。
- [x] 2.2 定义课程列表响应 DTO（含 chapter_count、total_lesson_count、teacher_names、creator_name），明确不暴露 description 字段。
- [x] 2.3 为 DTO 字段补齐默认值与示例（page/pageSize/status 等），确保 Swagger 文档可直接用于联调。

## 3. 管理端业务实现

- [x] 3.1 实现创建课程逻辑：从 ALS 获取操作者 ID，学校管理员自动写入所属 school_id，平台管理员校验并使用传入 school_id，新建课程默认未发布。
- [x] 3.2 实现更新课程逻辑：校验课程存在性与角色学校归属，更新允许字段并维护 update_time。
- [x] 3.3 实现删除逻辑：提供硬删除（物理删除）与软删除（status=未发布）两条路径，并统一处理不存在与越权异常。
- [x] 3.4 实现分页列表查询：支持 page/pageSize/keyword/status/school_id 条件过滤，按课程分页后批量聚合章节数、总课时数、任课老师姓名、创建者姓名。

## 4. 控制器与文档收口

- [x] 4.1 在 CourseController 新增 create、update、hardDelete、softDelete、list 接口并全部添加 @AdminAuth。
- [x] 4.2 为新增接口补齐 Swagger 控制器注解（@ApiTags、@ApiOperation、@ApiBody、@ApiResponse、@ApiBearerAuth），明确请求/响应结构。
- [x] 4.3 统一接口返回为 Result<T>，校验异常语义（400/401/403/404）与文档说明一致。