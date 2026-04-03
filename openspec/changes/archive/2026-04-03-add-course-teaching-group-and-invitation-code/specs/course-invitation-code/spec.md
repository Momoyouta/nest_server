## ADDED Requirements

### Requirement: 系统必须提供课程邀请码生成能力并绑定教学组
系统 SHALL 提供“学生加入课程”邀请码生成能力，邀请码类型 MUST 固定为 `2`，并与学校、课程、教学组绑定。

发码入口 MUST 同时支持管理员与同校教师：
- 管理端入口：`POST /admin/invite/createCourseInviteAdmin`（`@AdminAuth()` + `@Role(...AdminRoles)`）
- 教师端入口：`POST /invitation/createCourseInvite`（`@AllJwtAuth()` + `@Role(teacher)`）
- 两个入口 MUST 复用同一发码服务逻辑，行为一致。

请求体 DTO MUST 至少包含并校验：
- `course_id`: `@IsString @IsNotEmpty`
- `teaching_group`: `@IsString @IsNotEmpty`
- `ttl`: 可选 `@IsNumber @Min(1)`
- `school_id`: 管理端可传；教师端若未传 MUST 由服务端按当前教师归属学校推导

发码逻辑 MUST 满足：
- 校验课程存在且教学组属于该课程。
- 校验发码人对课程学校有权限（管理员按角色范围，教师仅限同校课程）。
- 教师发码时 MUST 额外校验其已绑定到目标 `course_id + teaching_group`。
- 课程邀请码 MUST 不限制使用次数，不引入使用次数上限字段。
- 在 `invitaion_code` 表记录邀请码，并写入 `teaching_group`、`create_time`（秒级时间戳）与 `ttl`（秒）字段。
- 同步写入 Redis（用于快速校验）并设置过期时间；响应返回 `code`、`createTime`、`ttl` 与 `expire_time`。

#### Scenario: 学校管理员生成课程邀请码成功
- **WHEN** 学校管理员对本校课程与教学组调用发码接口
- **THEN** 系统返回有效邀请码，并在 MySQL 与 Redis 均存在对应记录

#### Scenario: 教师跨校发码被拒绝
- **WHEN** 教师尝试为非本校课程生成邀请码
- **THEN** 系统返回 403 并拒绝创建邀请码

#### Scenario: 教师未绑定目标教学组发码被拒绝
- **WHEN** 教师尝试为未绑定的课程教学组生成邀请码
- **THEN** 系统返回 403 并拒绝创建邀请码

### Requirement: 学生必须可通过课程邀请码加入指定教学组
系统 SHALL 提供 `POST /student/joinCourseByInviteCode` 接口，允许学生通过课程邀请码加入目标课程教学组。

接口 MUST 使用用户端鉴权与角色控制：
- 鉴权：`@AllJwtAuth()`
- 角色：`@Role(student)`

请求体 DTO MUST 为：
- `code`: `@IsString @IsNotEmpty`

兑换逻辑 MUST 满足：
- 优先校验 Redis，再回源 MySQL，确保邀请码存在、未过期、类型为 `2`。
- 校验邀请码中的 `school_id/course_id/teaching_group` 关联合法。
- 将学生加入 `course_student`，并写入教学组关联字段与时间戳。
- 学生已在该课程时，接口 MUST 返回“已加入该课程”提示，且不得重复插入。

成功响应 MUST 返回 `Result<{ course_id: string; teaching_group: string; joined: true }>`。

#### Scenario: 学生使用有效邀请码加入课程成功
- **WHEN** 学生提交未过期且类型为 2 的邀请码
- **THEN** 系统将学生加入邀请码指定课程教学组并返回 `joined=true`

#### Scenario: 邀请码过期或不存在
- **WHEN** 学生提交无效邀请码
- **THEN** 系统返回 400 并提示邀请码不可用

#### Scenario: 学生重复使用邀请码加入同一课程
- **WHEN** 学生已在目标课程中再次提交有效邀请码
- **THEN** 系统返回“已加入该课程”提示并拒绝重复写入

### Requirement: 课程邀请码必须支持过期清理与一致性修复
系统 MUST 通过定时任务清理过期邀请码，确保 Redis 与 MySQL 的最终一致性。

清理任务 MUST 满足：
- 删除已过期的 Redis 邀请码键。
- 更新或删除 MySQL 中已过期邀请码记录（按项目既有策略执行）。
- 对“库有缓存无 / 缓存有库无”异常状态执行修复或失效处理。

#### Scenario: 定时任务清理过期邀请码
- **WHEN** 定时任务扫描到已过期邀请码
- **THEN** 系统清理缓存并将数据库记录标记为失效或删除，避免继续被兑换

### Requirement: 课程邀请码接口必须具备完整 OpenAPI 3.0 契约
系统 MUST 为课程邀请码生成与兑换接口补齐 Swagger 注解（`@ApiOperation`、`@ApiBody`、`@ApiResponse`、`@ApiBearerAuth`），并准确声明鉴权方式、字段校验与 `Result<T>` 响应结构。

#### Scenario: Swagger 可直接用于前后端联调
- **WHEN** 开发者查看邀请码相关接口文档
- **THEN** 文档中包含发码与兑换接口的完整请求约束、权限要求与响应模型
