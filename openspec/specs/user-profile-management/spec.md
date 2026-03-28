# user-profile-management Specification

## Purpose
TBD - created by archiving change add-user-account-management-apis. Update Purpose after archive.
## Requirements
### Requirement: 用户端资料编辑接口必须与管理员接口鉴权隔离
系统 MUST 提供用户端账号管理接口，并且这些接口 SHALL 使用用户 JWT 鉴权上下文，不得依赖管理员 JWT 或 AdminAuth 体系。用户端接口不得允许修改超出范围的敏感字段。

#### Scenario: 用户使用有效用户 JWT 访问资料接口
- **WHEN** 已登录用户携带有效用户 JWT 调用用户端资料编辑接口
- **THEN** 系统返回成功结果并仅对当前登录用户数据生效

#### Scenario: 未登录访问资料接口
- **WHEN** 请求未携带有效用户 JWT 调用用户端资料编辑接口
- **THEN** 系统返回 401 未授权错误

### Requirement: 系统必须提供基本信息修改接口并限制可修改字段
系统 SHALL 提供修改基本信息接口，当前仅允许更新 gender 字段，且后续可扩展其他允许字段。请求 DTO MUST 使用 class-validator 约束：gender 为必填整数且符合预定义枚举范围。

#### Scenario: 修改性别成功
- **WHEN** 用户提交合法 gender 值调用基本信息修改接口
- **THEN** 系统更新当前用户 gender 并返回更新后的关键字段

#### Scenario: 提交非法 gender
- **WHEN** 用户提交非整数或超出枚举范围的 gender
- **THEN** 系统返回 400 参数校验错误并不更新用户信息

### Requirement: 系统必须在修改密码前校验旧密码
系统 MUST 提供修改密码接口。请求 DTO MUST 包含 oldPassword 与 newPassword，并使用 class-validator 约束最小长度与非空规则。系统 SHALL 在写入新密码前使用加密校验验证 oldPassword 与当前密码哈希匹配。

#### Scenario: 旧密码正确时修改成功
- **WHEN** 用户提交正确 oldPassword 和合法 newPassword
- **THEN** 系统更新密码哈希并返回修改成功响应

#### Scenario: 旧密码错误时拒绝修改
- **WHEN** 用户提交错误 oldPassword
- **THEN** 系统返回 400 业务错误且密码不发生变化

### Requirement: 系统必须支持通过临时地址更新头像并落盘到固定路径
系统 SHALL 提供修改头像接口，接收 uploadImageTemp 产生的 tempAvatarPath。系统 MUST 校验路径属于受控临时目录，并将图片移动至 fileStore/users/avatars/{user_id}.png；若目标已存在 MUST 覆盖。移动成功后系统 MUST 更新 user.avatar 字段。

#### Scenario: 临时头像移动并更新成功
- **WHEN** 用户提交合法且存在的 tempAvatarPath
- **THEN** 系统将文件移动到固定头像路径并返回新的 avatar 地址

#### Scenario: 临时路径非法或文件不存在
- **WHEN** 用户提交不在白名单目录下的路径或源文件不存在
- **THEN** 系统返回 400 或 404 错误且不更新 user.avatar

### Requirement: 系统必须通过 Redis 验证码完成手机号修改
系统 MUST 提供单一手机号修改接口。该接口在未传 code 时 SHALL 生成 6 位数字验证码并写入 Redis（键需包含 userId 与 newPhone，TTL MUST 为 300 秒），并在控制台打印验证码；在传入 code 时 MUST 校验验证码一致后更新手机号，并删除验证码键。

#### Scenario: 发送验证码成功
- **WHEN** 用户调用 updatePhone 且提交合法 newPhone 但不传 code
- **THEN** 系统写入 Redis（TTL 300 秒）并返回发送成功响应

#### Scenario: 验证码正确时修改手机号成功
- **WHEN** 用户调用 updatePhone 并提交与 Redis 一致的 code 与 newPhone
- **THEN** 系统更新手机号并删除对应验证码键

#### Scenario: 验证码错误或过期
- **WHEN** 用户调用 updatePhone 并提交错误验证码或验证码已过期
- **THEN** 系统返回 400 业务错误且手机号不更新

