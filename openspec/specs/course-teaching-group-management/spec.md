## ADDED Requirements

### Requirement: 课程创建成功后必须自动初始化默认教学组
系统 MUST 在 `POST /course/createCourseAdmin` 创建课程成功后，于同一业务事务中创建该课程的默认教学组记录。

默认教学组数据 MUST 满足：
- 归属课程：`course_id` 等于新建课程 ID。
- 组名：系统默认值（如“默认教学组”）。
- 排序：`sort_order` 默认 `0`。
- 时间戳：`create_time` 与 `update_time` 为秒级字符串。

若默认教学组创建失败，课程创建流程 MUST 视为失败并回滚，不得出现“有课程无教学组”的持久化结果。

#### Scenario: 创建课程后自动创建默认教学组
- **WHEN** 管理员提交合法参数调用 `POST /course/createCourseAdmin`
- **THEN** 系统在返回课程 ID 前已创建该课程默认教学组，且课程与教学组数据一致持久化

#### Scenario: 默认教学组创建失败时整体回滚
- **WHEN** 课程创建后写入教学组阶段发生数据库异常
- **THEN** 系统回滚本次创建事务，课程与教学组均不落库

### Requirement: 系统必须提供教学组独立 CRUD 接口
系统 SHALL 提供教学组独立管理接口，支撑前端在课程配置页维护课程下教学组。

接口 MUST 使用管理员鉴权与角色控制：
- 鉴权：`@AdminAuth()`
- 角色：`@Role(...AdminRoles)`，学校管理员仅可操作本校课程教学组

接口与参数约束 MUST 满足：
- `POST /course/createTeachingGroupAdmin`
	- 请求体：`course_id`、`name`
	- 校验：课程存在且有权限；同课程下教学组名称不得重复
	- 说明：创建教学组不生成也不返回邀请码；邀请码应通过教学组ID在 `invitaion_code` 表查询
- `GET /course/listTeachingGroupAdmin`
	- 查询：`course_id`、`page`、`pageSize`
	- 行为：按课程分页返回教学组列表，并返回每个教学组下老师姓名列表 `teachers` 与该教学组最近课程邀请码 `invitation_create_time`、`invitation_code`、`invitation_ttl`
- `GET /course/getTeachingGroupAdmin/:id`
	- 行为：按教学组ID返回详情，并返回该教学组老师姓名列表 `teachers` 与该教学组最近课程邀请码 `invitation_create_time`、`invitation_ttl`
- `PUT /course/updateTeachingGroupAdmin`
	- 请求体：`teaching_group_id`、`name`
	- 行为：按教学组ID更新名称
- `DELETE /course/deleteTeachingGroupAdmin/:id`
	- 行为：按教学组ID删除教学组
	- 约束：课程必须至少保留一个教学组；教学组下存在学生或存在未失效课程邀请码时必须拒绝删除

除创建、列表外，教学组 CRUD 的详情/更新/删除 MUST 基于教学组 ID 执行。

#### Scenario: 管理员创建教学组成功
- **WHEN** 管理员提交合法 `course_id` 与教学组名称
- **THEN** 系统创建教学组并返回教学组ID

#### Scenario: 管理员按教学组ID查询详情
- **WHEN** 管理员调用教学组详情接口并传入合法教学组ID
- **THEN** 系统返回该教学组的基础信息

#### Scenario: 教学组查询返回邀请码时间元信息
- **WHEN** 管理员调用教学组列表或详情接口
- **THEN** 响应返回 `invitation_create_time`（数据库秒级时间戳）、`invitation_code` 与 `invitation_ttl`（秒）

#### Scenario: 管理员按教学组ID更新名称
- **WHEN** 管理员提交 `teaching_group_id` 与新名称
- **THEN** 系统更新对应教学组名称并返回 `updated=true`

#### Scenario: 删除课程最后一个教学组被拒绝
- **WHEN** 管理员删除课程唯一教学组
- **THEN** 系统返回 400 并拒绝删除

#### Scenario: 删除存在学生或有效邀请码的教学组被拒绝
- **WHEN** 教学组下存在学生或未失效课程邀请码
- **THEN** 系统返回 400 并拒绝删除

### Requirement: 系统必须提供教学组老师绑定接口
系统 SHALL 提供 `PUT /course/bindTeachingGroupTeachersAdmin` 管理端接口，用于覆盖式同步教学组老师关系。

接口 MUST 使用管理员鉴权与角色控制：
- 鉴权：`@AdminAuth()`
- 角色：`@Role(...AdminRoles)`，学校管理员仅可操作本校课程

请求体 DTO MUST 定义并校验：
- `course_id`: `@IsString @IsNotEmpty`
- `teaching_group_id`: `@IsString @IsNotEmpty`
- `teacher_ids`: `@IsArray @ArrayMinSize(1)`，元素 `@IsString @IsNotEmpty`，且去重后写入

处理逻辑 MUST 满足：
- 校验课程存在且操作者对课程有权限。
- 校验 `teaching_group_id` 必须属于 `course_id`。
- 校验 `teacher_ids` 中教师均存在且与课程学校一致。
- 在单事务内执行覆盖式同步：新增缺失关系、删除多余关系。
- 新增关系 MUST 写入 `create_time` 与 `update_time`；保留关系 MUST 刷新 `update_time`。
- 系统 MUST 同步维护 `course_teacher`：当老师被绑定到任一教学组时，课程老师关系存在；当老师不再属于该课程任何教学组时，课程老师关系移除。

成功响应 MUST 返回 `Result<{ course_id, teaching_group_id, teacher_ids, updated }>`，其中 `updated` 固定为 `true`。

#### Scenario: 覆盖式绑定成功
- **WHEN** 管理员传入课程、教学组与老师 ID 列表调用绑定接口
- **THEN** 系统将目标教学组老师集合同步为请求值并返回 `updated=true`

#### Scenario: 学校管理员越权操作他校课程
- **WHEN** 学校管理员对非本校课程调用绑定接口
- **THEN** 系统返回 403 并拒绝写入

#### Scenario: 绑定列表包含跨校老师
- **WHEN** 请求中的任一 `teacher_id` 不属于该课程学校
- **THEN** 系统返回 400 并拒绝本次同步

#### Scenario: 教学组绑定同步课程老师关系
- **WHEN** 管理员完成教学组老师绑定变更
- **THEN** 系统在同事务内同步更新 `course_teacher`，保证课程老师关系与教学组关系一致

### Requirement: 教学组老师同步能力必须可复用于批量导入
系统 MUST 在服务层提供可复用的教学组老师同步能力，供管理端单次绑定与后续批量导入共用，且两种入口的最终数据一致。

可复用能力 MUST 支持输入：`course_id`、`teaching_group_id`、`teacher_ids[]`、`operator_id`，并返回同步结果摘要（新增数量、移除数量、最终老师列表）。

#### Scenario: 管理端绑定与批量导入调用同一同步能力
- **WHEN** 管理端接口与批量导入流程分别同步同一教学组老师集合
- **THEN** 两者落库结果一致且不出现重复关系

### Requirement: 系统必须提供本校老师前缀检索接口用于教学组绑定
系统 SHALL 提供 `GET /course/querySchoolTeacherByNameAdmin` 管理端接口，用于在教学组绑定前检索可选老师。

接口 MUST 使用管理员鉴权与角色控制：
- 鉴权：`@AdminAuth()`
- 角色：`@Role(...AdminRoles)`，学校管理员仅可查询本校

查询参数 DTO MUST 定义并校验：
- `school_id`: 平台管理员场景必填，`@IsString @IsNotEmpty`
- `name`: 必填，`@IsString @IsNotEmpty`
- `page`: 可选，`@Type(() => Number) @IsInt @Min(1)`，默认 `1`
- `pageSize`: 可选，`@Type(() => Number) @IsInt @Min(1)`，默认 `10`

查询逻辑 MUST 满足：
- 按学校隔离查询，禁止跨学校返回老师。
- 姓名匹配 MUST 使用左到右前缀匹配（`name LIKE :name%`），不得使用包含匹配（`%name%`）。
- 响应项仅返回老师 `id` 与姓名 `name`，并返回分页总数。

成功响应 MUST 返回 `Result<{ list: Array<{ id: string; name: string }>; total: number }>`。

#### Scenario: 前缀匹配命中老师姓名
- **WHEN** 管理员以 `name=a` 查询本校老师
- **THEN** 系统仅返回姓名以 `a` 开头的老师，不返回姓名包含 `a` 但非前缀的老师（如 `bac`）

#### Scenario: 学校管理员查询他校老师
- **WHEN** 学校管理员传入非所属学校 `school_id` 查询
- **THEN** 系统返回 403 并拒绝查询

### Requirement: 教学组老师绑定接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为 `PUT /course/bindTeachingGroupTeachersAdmin` 提供完整 Swagger 注解（`@ApiOperation`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth`），并在文档中准确展示请求字段校验规则与 `Result<T>` 响应结构。

#### Scenario: Swagger 中可见绑定接口完整契约
- **WHEN** 开发者查看课程管理相关 OpenAPI 文档
- **THEN** 可直接获得绑定接口的鉴权要求、请求参数约束与统一响应模型
