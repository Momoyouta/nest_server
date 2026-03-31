# admin-course-management Specification

## Purpose
TBD - created by archiving change add-admin-course-crud. Update Purpose after archive.
## Requirements
### Requirement: 管理端课程接口必须使用管理员鉴权并与用户端隔离
系统 MUST 提供管理端课程接口集合，且所有接口 SHALL 使用 @AdminAuth 进行管理员 JWT 鉴权，不得通过 @Public() 暴露。该能力范围仅限管理端，不包含用户端课程接口。

#### Scenario: 管理员调用课程管理接口
- **WHEN** 管理员携带有效管理员 JWT 调用课程管理接口
- **THEN** 系统允许访问并按业务规则执行

#### Scenario: 未登录或使用非管理员 JWT 调用课程管理接口
- **WHEN** 请求缺失管理员 JWT 或令牌类型不匹配
- **THEN** 系统返回 401 未授权错误

### Requirement: 系统必须提供课程创建接口并执行角色归属校验
系统 SHALL 提供 POST /course/createCourseAdmin 接口。CreateCourseDto MUST 满足以下校验：
- name: 必填，@IsString @IsNotEmpty @MaxLength(255)
- school_id: 平台管理员场景必填，@IsString @IsNotEmpty
- cover_img: 可选，@IsString @MaxLength(500)
- description: 可选，@IsString

创建逻辑 MUST 从 ALS 获取操作者 userId 并写入 creator_id；新建课程 status MUST 固定为 CourseStatusMap.UNPUBLISHED(0)。学校管理员 MUST 自动使用自身所属 school_id；平台管理员 MUST 显式传入 school_id 并通过学校存在性校验。

#### Scenario: 学校管理员创建课程成功
- **WHEN** 学校管理员提交合法课程名称并调用创建接口
- **THEN** 系统使用其所属 school_id 创建课程，creator_id 为 ALS 用户 ID，且 status 为未发布

#### Scenario: 平台管理员缺失 school_id
- **WHEN** 平台管理员调用创建接口但未提供 school_id
- **THEN** 系统返回 400 参数错误并拒绝创建

#### Scenario: 学校管理员伪造其他学校 school_id
- **WHEN** 学校管理员请求体携带与其所属学校不一致的 school_id
- **THEN** 系统返回 403 或 400 并拒绝创建

### Requirement: 系统必须提供课程更新接口并限制学校管理员越权
系统 SHALL 提供 PUT /course/updateCourseAdmin 接口。UpdateCourseDto MUST 至少包含 id，其他可更新字段包括 name、cover_img、description、status，并使用 class-validator 进行类型与长度校验。

更新时系统 MUST 校验课程存在；若操作者为学校管理员，MUST 校验课程 school_id 与其所属学校一致，否则拒绝。

#### Scenario: 平台管理员更新课程成功
- **WHEN** 平台管理员提交存在的课程 id 与合法更新字段
- **THEN** 系统更新课程并返回 updated=true

#### Scenario: 学校管理员更新非本校课程
- **WHEN** 学校管理员尝试更新 school_id 不属于本校的课程
- **THEN** 系统返回 403 或 400 并拒绝更新

### Requirement: 系统必须同时支持课程硬删除与软删除
系统 SHALL 提供两个删除接口：DELETE /course/hardDeleteCourseAdmin/:id 与 PUT /course/softDeleteCourseAdmin/:id。
- 硬删除 MUST 在事务内先清理课程关联数据（至少包括章节、课时、授课教师关系、选课关系、学习记录、课程作业链路数据），再删除 course 记录。
- 软删除 MUST 将课程 status 更新为 CourseStatusMap.UNPUBLISHED(0)，并更新 update_time。

两类删除均 MUST 校验课程存在，且学校管理员 MUST 仅能操作本校课程。

#### Scenario: 软删除课程成功
- **WHEN** 管理员调用软删除接口且课程存在且权限合法
- **THEN** 系统将课程状态更新为未发布并返回 mode=soft

#### Scenario: 硬删除课程成功
- **WHEN** 管理员调用硬删除接口且课程存在且权限合法
- **THEN** 系统物理删除课程记录并返回 mode=hard

#### Scenario: 删除不存在课程
- **WHEN** 管理员对不存在的课程 id 调用硬删除或软删除
- **THEN** 系统返回 404 资源不存在错误

### Requirement: 系统必须提供分页条件列表查询并返回聚合字段
系统 SHALL 提供 GET /course/listCourseAdmin 接口，查询 DTO MUST 包含并校验：
- page: @Type(() => Number) @IsInt @Min(1)，默认 1
- pageSize: @Type(() => Number) @IsInt @Min(1)，默认 10
- keyword: 可选，@IsString
- status: 可选，@Type(() => Number) @IsIn([0,1])
- school_id: 平台管理员必填，@IsString @IsNotEmpty（学校管理员场景下由服务端强制覆盖为所属学校）

列表响应 MUST 返回 Result<{ list, total }>，且 list 项 MUST 不包含 description，并额外包含：
- chapter_count（章节数）
- total_lesson_count（总课时数）
- teacher_names（任课老师姓名数组）
- creator_name（创建者姓名）

#### Scenario: 分页查询返回聚合字段
- **WHEN** 管理员按 page=1,pageSize=10 调用列表接口
- **THEN** 系统返回 list 与 total，且每条数据包含 chapter_count、total_lesson_count、teacher_names、creator_name

#### Scenario: 列表不返回 description 字段
- **WHEN** 管理员调用课程列表接口
- **THEN** 返回数据中不包含 description 字段

#### Scenario: 学校管理员按学校范围查询
- **WHEN** 学校管理员调用列表接口且传入其他 school_id
- **THEN** 系统仅按其所属学校查询或拒绝该非法条件

### Requirement: 新增课程管理接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为 POST /course/createCourseAdmin、PUT /course/updateCourseAdmin、DELETE /course/hardDeleteCourseAdmin/:id、PUT /course/softDeleteCourseAdmin/:id、GET /course/listCourseAdmin 补齐 Swagger 注解（如 @ApiOperation、@ApiBody、@ApiResponse、@ApiBearerAuth），并确保请求参数、校验规则与响应结构可在 OpenAPI 文档中直接用于前后端联调。

#### Scenario: 开发者查看 Swagger 文档
- **WHEN** 开发者在 Swagger UI 查看课程管理接口
- **THEN** 可看到完整的请求参数约束、鉴权要求与 Result<T> 响应模型

