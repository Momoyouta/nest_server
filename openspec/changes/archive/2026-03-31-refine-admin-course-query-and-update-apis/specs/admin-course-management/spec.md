## ADDED Requirements

### Requirement: 系统必须提供单课程基础信息查询接口
系统 SHALL 提供 GET /course/getCourseBasicAdmin/:id 接口，并要求使用管理员鉴权与角色校验。接口 MUST 校验课程存在性与学校管理员的数据范围权限。

响应 data MUST 返回课程基础字段（来自 course 表，排除 description）：
- id
- school_id
- creator_id
- name
- cover_img
- status
- create_time
- update_time

并且 MUST 追加以下关联展示字段：
- school_name（课程所属学校名称）
- creator_name（课程创建者姓名）
- teacher_names（任课老师姓名数组）

teacher_names SHALL 按默认查询顺序返回，系统 MUST NOT 对其提供固定排序承诺。

#### Scenario: 管理员查询单课程基础信息成功
- **WHEN** 管理员携带有效管理员 JWT，调用 GET /course/getCourseBasicAdmin/:id，且课程存在且权限合法
- **THEN** 系统返回 Result 成功响应，data 包含课程基础字段（不含 description）以及 school_name、creator_name、teacher_names

#### Scenario: 查询不存在课程
- **WHEN** 管理员调用 GET /course/getCourseBasicAdmin/:id 且课程 ID 不存在
- **THEN** 系统返回 404 资源不存在错误

#### Scenario: 学校管理员查询他校课程
- **WHEN** 学校管理员调用 GET /course/getCourseBasicAdmin/:id 且课程 school_id 不属于其所属学校
- **THEN** 系统返回 403 权限不足错误

### Requirement: 系统必须提供独立的课程简介查询接口并支持双端访问
系统 SHALL 提供 GET /course/getCourseDescription/:id 接口，并使用 @AllJwtAuth() 装饰器，允许管理端用户和用户端普通用户在登录后均可访问。

接口 MUST 返回包含 description 字段的对象。

#### Scenario: 登录用户查询课程简介成功
- **WHEN** 任意携带有效 JWT (管理端或用户端) 的用户调用 GET /course/getCourseDescription/:id，且课程存在
- **THEN** 系统返回 Result 成功响应，data 包含 description 字段

## MODIFIED Requirements

### Requirement: 系统必须提供课程更新接口并限制学校管理员越权
系统 SHALL 提供 PUT /course/updateCourseAdmin 接口。UpdateCourseDto MUST 至少包含 id，可更新字段包括 name、cover_img、description、status，并使用 class-validator 进行类型与长度校验：
- id: @IsString @IsNotEmpty
- name: @IsOptional @IsString @IsNotEmpty @MaxLength(255)
- cover_img: @IsOptional @IsString @MaxLength(500)
- description: @IsOptional @IsString
- status: @IsOptional @Type(() => Number) @IsInt @IsIn([0,1])

更新时系统 MUST 校验课程存在；若操作者为学校管理员，MUST 校验课程 school_id 与其所属学校一致，否则拒绝。

#### Scenario: 平台管理员更新课程成功
- **WHEN** 平台管理员提交存在的课程 id 与合法更新字段（含 name、cover_img、description、status）
- **THEN** 系统更新课程并返回 updated=true

#### Scenario: 学校管理员更新非本校课程
- **WHEN** 学校管理员尝试更新 school_id 不属于本校的课程
- **THEN** 系统返回 403 或 400 并拒绝更新

### Requirement: 系统必须提供分页条件列表查询并返回聚合字段
系统 SHALL 提供 GET /course/listCourseAdmin 接口，查询 DTO MUST 包含并校验：
- page: @Type(() => Number) @IsInt @Min(1)，默认 1
- pageSize: @Type(() => Number) @IsInt @Min(1)，默认 10
- keyword: 可选，@IsString
- status: 可选，@Type(() => Number) @IsIn([0,1])
- school_id: 平台管理员必填，@IsString @IsNotEmpty（学校管理员场景下由服务端强制覆盖为所属学校）

列表响应 MUST 返回 Result<{ list, total }>，且 list 项 MUST 不包含 description，并额外包含：
- school_name（课程所属学校名称）
- teacher_names（任课老师姓名数组）
- creator_name（创建者姓名）

列表响应 MUST NOT 返回以下聚合字段：
- chapter_count
- total_lesson_count

#### Scenario: 分页查询返回学校名与关联人信息
- **WHEN** 管理员按 page=1,pageSize=10 调用列表接口
- **THEN** 系统返回 list 与 total，且每条数据包含 school_name、teacher_names、creator_name

#### Scenario: 列表不返回 description 与计数字段
- **WHEN** 管理员调用课程列表接口
- **THEN** 返回数据中不包含 description、chapter_count、total_lesson_count 字段

#### Scenario: 学校管理员按学校范围查询
- **WHEN** 学校管理员调用列表接口且传入其他 school_id
- **THEN** 系统仅按其所属学校查询或拒绝该非法条件

### Requirement: 新增课程管理接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为 POST /course/createCourseAdmin、PUT /course/updateCourseAdmin、DELETE /course/hardDeleteCourseAdmin/:id、PUT /course/softDeleteCourseAdmin/:id、GET /course/listCourseAdmin、GET /course/getCourseBasicAdmin/:id、GET /course/getCourseDescription/:id 补齐 Swagger 注解（如 @ApiOperation、@ApiBody、@ApiResponse、@ApiBearerAuth），并确保请求参数、校验规则与响应结构可在 OpenAPI 文档中直接用于前后端联调。

其中 PUT /course/updateCourseAdmin 的 OpenAPI 摘要应准确描述支持更新的字段；GET /course/listCourseAdmin 与 GET /course/getCourseBasicAdmin/:id 的响应模型 MUST 与本规格要求字段一致。

#### Scenario: 开发者查看 Swagger 文档
- **WHEN** 开发者在 Swagger UI 查看课程管理接口
- **THEN** 可看到完整的请求参数约束、鉴权要求与 Result<T> 响应模型，且新接口均可直接联调
不包含 description，并额外包含：
- school_name（课程所属学校名称）
- teacher_names（任课老师姓名数组）
- creator_name（创建者姓名）

列表响应 MUST NOT 返回以下聚合字段：
- chapter_count
- total_lesson_count

#### Scenario: 分页查询返回学校名与关联人信息
- **WHEN** 管理员按 page=1,pageSize=10 调用列表接口
- **THEN** 系统返回 list 与 total，且每条数据包含 school_name、teacher_names、creator_name

#### Scenario: 列表不返回 description 与计数字段
- **WHEN** 管理员调用课程列表接口
- **THEN** 返回数据中不包含 description、chapter_count、total_lesson_count 字段

#### Scenario: 学校管理员按学校范围查询
- **WHEN** 学校管理员调用列表接口且传入其他 school_id
- **THEN** 系统仅按其所属学校查询或拒绝该非法条件

### Requirement: 新增课程管理接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为 POST /course/createCourseAdmin、PUT /course/updateCourseAdmin、DELETE /course/hardDeleteCourseAdmin/:id、PUT /course/softDeleteCourseAdmin/:id、GET /course/listCourseAdmin、GET /course/getCourseBasicAdmin/:id 补齐 Swagger 注解（如 @ApiOperation、@ApiBody、@ApiResponse、@ApiBearerAuth），并确保请求参数、校验规则与响应结构可在 OpenAPI 文档中直接用于前后端联调。

其中 PUT /course/updateCourseAdmin 的 OpenAPI 请求体 MUST 仅暴露 id、name、cover_img、status；GET /course/listCourseAdmin 与 GET /course/getCourseBasicAdmin/:id 的响应模型 MUST 与本规格要求字段一致。

#### Scenario: 开发者查看 Swagger 文档
- **WHEN** 开发者在 Swagger UI 查看课程管理接口
- **THEN** 可看到完整的请求参数约束、鉴权要求与 Result<T> 响应模型，且新增单课程基础信息接口可直接联调
