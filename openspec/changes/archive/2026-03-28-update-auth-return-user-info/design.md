## Context

当前认证模块的 `login`、`register` 接口主要返回 token，`jwtAuth` 接口主要返回布尔验证结果。前端在登录后仍需要额外请求或自行解析 token 才能拿到基础用户信息，导致接口协作成本和客户端复杂度增加。

项目使用 NestJS + TypeORM + JWT（RS256），接口统一包装为 `Result<T>` 结构，并要求使用 Swagger 装饰器产出 OpenAPI 3.0 文档。因此本次方案需要在不改变认证主流程（密码校验、token 签发、守卫判定）的前提下，扩展认证响应 DTO 与接口契约。

## Goals / Non-Goals

**Goals:**
- 在 `POST /auth/login`、`POST /auth/register`、`GET /auth/jwtAuth` 的成功响应中统一返回 `baseUserInfo`，字段包含 `userId`、`userRoles`、`userName`。
- 在保持 `Result<T>` 包装不变的情况下，补全响应 DTO 及 `@ApiProperty` 标注，确保 OpenAPI 3.0 文档可直接用于前端联调。
- 保持 JWT 认证和角色守卫语义不变，仅扩展响应数据。

**Non-Goals:**
- 不改动 JWT 密钥、签发算法、过期策略。
- 不调整认证以外模块（如用户管理、角色管理）的业务逻辑。
- 不引入新的数据库表或实体字段。

## Decisions

### 1. 统一基础信息模型并复用到三个认证接口
- 决策：新增（或抽取）`BaseUserInfo` 响应 DTO，并在登录、注册、鉴权成功响应中复用。
- 原因：统一字段命名和类型，避免三个接口返回结构漂移。
- 备选方案：各接口分别定义匿名结构。
- 放弃原因：重复定义会增加维护成本，Swagger 展示也不一致。

### 2. `jwtAuth` 从布尔结果扩展为带用户信息的对象
- 决策：`jwtAuth` 成功时返回 `{ valid: true, baseUserInfo }`（外层仍为 `Result<T>`）。
- 原因：保持“鉴权通过”语义显式，同时满足前端直接消费用户基础信息。
- 备选方案：仅返回 `baseUserInfo`。
- 放弃原因：调用方无法直接区分历史语义中的验证布尔值。

### 3. 在 Service 层组装 `baseUserInfo`
- 决策：在 `AuthService` 登录/注册流程中通过用户实体与角色查询组装返回；`jwtAuth` 基于守卫解出的用户上下文或 token payload 查询并组装。
- 原因：Controller 保持薄层，业务聚合逻辑集中在 Service。
- 备选方案：Controller 手工拼装返回字段。
- 放弃原因：会引入重复逻辑，不利于后续复用和测试。

### 4. OpenAPI 3.0 契约明确化
- 决策：为响应 DTO 的 `token`、`valid`、`baseUserInfo.userId`、`baseUserInfo.userRoles`、`baseUserInfo.userName` 提供完整 `@ApiProperty` 描述与示例。
- 原因：确保 Swagger 文档即契约，减少前后端对齐成本。

## OpenAPI 3.0 Specifications

### POST /auth/login
- Summary: 用户登录
- Security: `@Public()`，无需 Bearer token
- Request Body: 现有登录 DTO（保持不变）
- 200 Response (`Result<LoginResponseDto>`):
  - `code`: number
  - `msg`: string
  - `data.token`: string
  - `data.baseUserInfo.userId`: string
  - `data.baseUserInfo.userRoles`: string[]
  - `data.baseUserInfo.userName`: string

### POST /auth/register
- Summary: 用户注册
- Security: `@Public()`，无需 Bearer token
- Request Body: 现有注册 DTO（保持不变）
- 200 Response (`Result<RegisterResponseDto>`):
  - `code`: number
  - `msg`: string
  - `data.token`: string
  - `data.baseUserInfo.userId`: string
  - `data.baseUserInfo.userRoles`: string[]
  - `data.baseUserInfo.userName`: string

### GET /auth/jwtAuth
- Summary: JWT 有效性校验并返回用户基础信息
- Security: Bearer JWT（默认鉴权，不使用 `@Public()`）
- 200 Response (`Result<JwtAuthResponseDto>`):
  - `code`: number
  - `msg`: string
  - `data.valid`: boolean（成功场景为 `true`）
  - `data.baseUserInfo.userId`: string
  - `data.baseUserInfo.userRoles`: string[]
  - `data.baseUserInfo.userName`: string

## Risks / Trade-offs

- [Risk] 角色信息来源不一致（token payload 与数据库实时角色）可能导致短时差异。
  - Mitigation：统一以数据库查询结果组装 `userRoles`；若查询失败，抛出明确业务异常并由全局过滤器包装。
- [Risk] 响应结构升级可能影响依赖旧字段的客户端。
  - Mitigation：保持旧字段（如 `token`、`valid`）不删除，仅新增 `baseUserInfo`，确保向后兼容。
- [Trade-off] 每次认证成功响应增加一次用户信息组装成本。
  - Mitigation：字段仅限基础信息，避免返回冗余敏感数据。

## Migration Plan

1. 增加并发布新的响应 DTO 与 Swagger 文档。
2. 修改 `AuthService` 和 `AuthController` 返回结构并补充单元/集成测试。
3. 在测试环境验证三个接口响应契约后上线。
4. 回滚策略：若出现兼容性问题，可快速回退至上一版本接口实现（数据库与配置无迁移操作）。

## Open Questions

- `userName` 字段应优先取 `username` 还是展示名（若后续引入 profile）？当前按现有用户实体用户名返回。
- `userRoles` 返回角色英文名、中文名还是角色 ID？当前按前端权限判断需求返回字符串数组（与现有权限逻辑一致）。