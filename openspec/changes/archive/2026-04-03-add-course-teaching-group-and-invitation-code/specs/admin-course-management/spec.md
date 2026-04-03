## MODIFIED Requirements

### Requirement: 系统必须提供课程基础信息查询接口
系统 SHALL 提供 `GET /course/getCourseBasicAdmin/:id` 管理端接口返回课程基础信息。

#### Scenario: 查询课程基础信息成功
- **WHEN** 管理员查询课程基础信息且课程存在
- **THEN** 响应返回课程基础字段与任课老师列表

### Requirement: 系统必须提供课程创建接口并执行角色归属校验
系统 SHALL 提供 `POST /course/createCourseAdmin` 接口。`CreateCourseDto` MUST 满足以下校验：
- `name`: 必填，`@IsString @IsNotEmpty @MaxLength(255)`
- `school_id`: 平台管理员场景必填，`@IsString @IsNotEmpty`
- `cover_img`: 可选，`@IsString @MaxLength(500)`
- `description`: 可选，`@IsString`

创建逻辑 MUST 从 ALS 获取操作者 `userId` 并写入 `creator_id`；新建课程 `status` MUST 固定为 `CourseStatusMap.UNPUBLISHED(0)`。学校管理员 MUST 自动使用自身所属 `school_id`；平台管理员 MUST 显式传入 `school_id` 并通过学校存在性校验。

系统 MUST 在课程创建成功后，同时完成以下初始化：
- 在文件存储系统中自动创建课程专属目录结构，路径为 `fileStore/schools/{school_id}/courses/{course_id}/`，且下属子目录至少包含 `documents/`、`images/`、`chapters/`、`homework/`。
- 在教学组表中自动创建该课程的默认教学组记录（`course_id` 绑定新课程，`create_time/update_time` 为秒级字符串）。

课程、目录、默认教学组初始化 MUST 保持一致性：任一步骤失败时，系统 MUST 拒绝本次创建并避免出现“仅创建部分资源”的状态。

#### Scenario: 学校管理员创建课程并自动完成初始化
- **WHEN** 学校管理员提交合法课程名称并调用创建接口
- **THEN** 系统创建课程记录、课程目录与默认教学组，并返回课程 ID

#### Scenario: 平台管理员缺失 school_id
- **WHEN** 平台管理员调用创建接口但未提供 `school_id`
- **THEN** 系统返回 400 参数错误并拒绝创建

#### Scenario: 学校管理员伪造其他学校 school_id
- **WHEN** 学校管理员请求体携带与其所属学校不一致的 `school_id`
- **THEN** 系统返回 403 或 400 并拒绝创建

#### Scenario: 默认教学组初始化失败
- **WHEN** 课程记录已写入但教学组初始化阶段发生异常
- **THEN** 系统回滚本次创建流程，不保留部分成功数据

### Requirement: 新增课程管理接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为以下管理端课程接口补齐 Swagger 注解（如 `@ApiOperation`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth`），并确保请求参数、校验规则与响应结构可在 OpenAPI 文档中直接用于前后端联调：
- `POST /course/createCourseAdmin`
- `POST /course/createTeachingGroupAdmin`
- `GET /course/listTeachingGroupAdmin`
- `GET /course/getTeachingGroupAdmin/:id`
- `PUT /course/updateTeachingGroupAdmin`
- `DELETE /course/deleteTeachingGroupAdmin/:id`
- `PUT /course/updateCourseAdmin`
- `PUT /course/updateCourseCoverAdmin`
- `DELETE /course/hardDeleteCourseAdmin/:id`
- `PUT /course/softDeleteCourseAdmin/:id`
- `GET /course/listCourseAdmin`
- `POST /course/saveCourseDraftAdmin`
- `POST /course/publishCourseOutlineAdmin`
- `PUT /course/updateChapterTitleQuickAdmin`
- `PUT /course/updateLessonQuickAdmin`
- `PUT /course/bindTeachingGroupTeachersAdmin`
- `GET /course/querySchoolTeacherByNameAdmin`
- `GET /course/getCourseBasicAdmin/:id`

其中课程发布接口 `POST /course/publishCourseOutlineAdmin` 的响应契约 MUST 明确包含 `id_mappings` 字段（章节与课时 `temp_id -> real_id` 映射）。

所有接口响应 MUST 统一为 `Result<T>`，并在 OpenAPI 中明确 `code/msg/data` 结构。

#### Scenario: 开发者查看 Swagger 文档
- **WHEN** 开发者在 Swagger UI 查看课程管理接口
- **THEN** 可看到完整的请求参数约束、鉴权要求与 Result<T> 响应模型
