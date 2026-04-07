## Why

当前用户端 token 不携带 schoolId，业务层大量依赖手传 schoolId/teacherId/studentId，存在参数冗余、租户边界不稳定与越权风险。为支持“登录后选学校再进入系统”的新流程，需要将学校上下文纳入认证链路并沉淀到 ALS。

## What Changes

- 用户端认证改造为两阶段：账号密码成功后返回不含 schoolId 的过渡 token；用户选择学校后换发含 schoolId 的业务 token。
- 认证解析后将 userId、role、schoolId 写入 alsService；用户端业务查询统一从 ALS 取上下文。
- 用户端“本人操作”接口去除手工传递 schoolId/teacherId/studentId。
- 增加学校切换接口，支持同账号在已加入学校间切换。
- AdminJWTAuth 保持不变，仅改造用户端 auth。
- 新增 OpenAPI 接口：登录后学校列表、确认选校换发 token、切换当前学校。

## Capabilities

### New Capabilities
- `user-school-context-selection`: 登录后选校、换发带 schoolId token、切校能力。
- `user-als-context-propagation`: 将用户上下文统一注入 ALS 并在业务层消费。

### Modified Capabilities
- `user-auth`: 登录态由单阶段改为两阶段，token 声明结构调整。
- `tenant-file-isolation`: 用户侧租户来源由请求参数改为 ALS 上下文。
- `user-profile-management`: 本人接口移除 schoolId/teacherId/studentId 入参依赖。

## Goals

- 用户端实现稳定多租户上下文：token 携带 schoolId，业务从 ALS 读取。
- 支持登录后选校与已加入学校切换。
- 降低接口参数负担，统一“本人接口”身份来源。

## Non-goals

- 不改造 AdminJWTAuth 与管理端 token 结构。
- 不重构无关业务模块与非用户端权限模型。
- 不引入跨租户数据共享能力。

## Impact

- 影响模块：`auth`、`common/guard`、`student`、`teacher`、`course`、`file` 等用户侧接口。
- 影响数据：用户-学校关系与登录会话相关表需补充字段/索引以支持选校与切校。
- 影响 API：新增“登录后选校/切校”接口，多个用户端接口请求参数将精简。
