## Context

现有系统已具备 JWT 登录鉴权、角色装饰器、Redis 模块及文件上传能力，但用户端缺少统一的账号管理接口。当前需求要求在原有模块中补齐用户侧自助编辑能力，并且与管理员侧受 AdminAuth 保护的接口严格区分，避免普通用户越权修改敏感字段。

约束如下：
- 保持现有 NestJS + TypeORM + Result<T> 返回规范。
- 用户端接口默认走普通用户 JWT 鉴权，不使用管理员 JWT。
- 头像来源为 uploadImageTemp 产生的临时地址，需在业务层完成文件移动与覆盖。
- 手机号验证码写入 Redis，有效期 5 分钟，暂不对接短信平台。

## Goals / Non-Goals

**Goals:**
- 在用户模块内新增 4 个用户端接口：修改基本信息、修改密码、修改头像、修改手机号。
- 明确用户端鉴权与管理员端鉴权隔离：用户端接口不使用 AdminAuth。
- 完整定义 OpenAPI 3.0 请求/响应契约与异常场景。
- 复用现有 user 实体字段，不引入额外表结构。

**Non-Goals:**
- 不新增独立业务模块。
- 不改动管理员端已有账号管理接口。
- 不接入真实短信发送，仅记录验证码日志。

## Decisions

### 1) 接口边界与路径设计
采用用户中心语义的用户端接口，均挂载在用户模块下并要求用户 JWT：
- PUT /user/profile/updateBasic
  - 用途：修改可扩展的基础资料字段（本期仅 gender）。
- PUT /user/profile/updatePassword
  - 用途：修改密码，必须校验 oldPassword 正确后才允许写入 newPassword。
- PUT /user/profile/updateAvatar
  - 用途：接收 tempAvatarPath，将临时文件移动为 fileStore/users/avatars/{userId}.png 并更新 user.avatar。
- PUT /user/profile/updatePhone
  - 用途：统一手机号修改入口；当 code 为空时生成验证码并写入 Redis（TTL=300 秒，console.log 输出），携带 code 时校验并更新手机号。

选择该拆分方式的原因：
- 基础信息、安全信息、文件信息、验证码流程生命周期不同，拆分后更易做权限与风控扩展。
- 手机号更新在业务上天然是两步流程，显式拆分更符合 OpenAPI 契约表达。

备选方案：单一 PATCH /user/profile 统一修改。
- 放弃原因：密码、验证码与头像迁移具有不同前置校验和失败语义，统一接口会导致 DTO 臃肿与校验复杂。

### 2) 鉴权与权限控制策略
- 用户端接口使用普通 Auth 体系（JWT + 当前用户上下文），不加 AdminAuth 装饰器。
- 不使用 @Public()，均要求登录态。
- 管理员端接口继续保留 AdminAuth，不在本变更中调整。

原因：满足“区分于 AdminAuth 接口”的核心需求，同时避免引入双 JWT 混用风险。

### 3) 密码修改安全策略
- 入参：oldPassword、newPassword。
- 逻辑：读取当前用户密码哈希，bcrypt.compare(oldPassword, hash) 通过后才允许更新；newPassword 使用现有加密策略重新哈希。
- 失败语义：旧密码错误返回 400 业务异常。

备选方案：仅校验 token 不校验旧密码。
- 放弃原因：不满足安全要求，存在登录态劫持后直接改密风险。

### 4) 头像文件落盘策略
- 入参：tempAvatarPath（来自 uploadImageTemp 返回）。
- 处理：
  - 校验路径位于临时上传目录白名单内。
  - 目标固定为 fileStore/users/avatars/{userId}.png。
  - 若目标存在则覆盖；移动成功后更新 user.avatar 为可访问地址。
  - 移动失败或源文件不存在时抛出 BadRequestException。

备选方案：直接保存临时地址到 user.avatar。
- 放弃原因：临时目录生命周期不稳定，且不利于头像命名规范与后续清理。

### 5) 手机号验证码与 Redis Key 设计
- 发送验证码接口：生成 6 位随机码，写入 Redis 键 user:phone:update:{userId}:{newPhone}，TTL 300 秒。
- 由于无短信服务，验证码通过 console.log 输出，响应不返回验证码明文。
- 提交修改接口：对比 Redis 验证码，成功后更新 user.phone，并删除验证码 key。

备选方案：仅用 userId 作为 key。
- 放弃原因：同一用户并发尝试多个手机号时会互相覆盖，绑定 newPhone 可降低冲突。

### 6) OpenAPI 3.0 规范
- 通用：所有接口返回 Result<T>，需补齐 @ApiOperation/@ApiBody/@ApiOkResponse/@ApiBadRequestResponse 注解。

1. PATCH /user/profile/basic
- Request: { gender: number }
- Response: Result<{ userId: string; gender: number }>

2. PATCH /user/profile/password
- Request: { oldPassword: string; newPassword: string }
- Response: Result<{ updated: true }>

3. PATCH /user/profile/avatar
- Request: { tempAvatarPath: string }
- Response: Result<{ avatar: string }>

4. PUT /user/profile/updatePhone
- Request: { newPhone: string; code?: string }
- Response(发送验证码): Result<{ sent: true; expireInSeconds: 300 }>
- Response(完成修改): Result<{ updated: true; phone: string }>

错误响应：
- 400：参数非法、旧密码错误、验证码错误、头像临时路径非法。
- 401：未登录。
- 404：用户不存在或头像源文件不存在（按现有异常语义择一实现）。

### 7) TypeORM 实体变更
- 不新增字段、不修改关联。
- 复用 user 实体现有字段：gender、password、avatar、phone、update_time。
- 创建/更新时间戳规则不变，本变更仅涉及更新逻辑，需确保 update_time 正确写入。

## Risks / Trade-offs

- [Risk] 临时文件路径被伪造导致越权读取。 -> Mitigation：仅允许处理受控临时目录前缀，且做文件存在性校验。
- [Risk] 验证码暴力尝试。 -> Mitigation：后续可增加 Redis 尝试次数限制，本次先保留扩展点。
- [Risk] 手机号唯一性冲突。 -> Mitigation：更新前做手机号唯一性检查并返回明确异常。
- [Trade-off] 未接入真实短信时仅日志输出，安全性低于真实链路。 -> Mitigation：仅用于开发联调环境，生产前切换短信服务实现。

## Migration Plan

1. 新增 DTO 与 controller/service 处理逻辑，补齐 Swagger 注解。
2. 接口联调验证：密码校验、头像迁移、验证码写入与过期行为。
3. 回归管理员端接口，确认未受用户端改造影响。
4. 若出现回归问题，回滚应用版本即可（无数据库结构迁移）。

## Open Questions

- gender 字段最终取值范围是否采用枚举映射（例如 unknown/male/female）并在 map 文件统一管理？
- avatar 字段对外返回完整 URL 还是相对路径，是否统一通过文件模块拼接？
- 手机号变更是否需要二次校验登录态（如密码确认）作为高风险操作增强？