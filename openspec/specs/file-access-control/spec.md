# File Access Control Specification

## Purpose
规范文件资源的访问权限校验，支持 Nginx `auth_request` 的内部鉴权分发。

## Requirements

### Requirement: 获取视频切片流鉴权配置 (Check File Permission Adapter)
后端必须适应 Nginx 的静态文件的 `auth_request` 内部调用拦截，更新 OpenAPI 鉴权接口 `GET /auth/checkFilePermission`。该接口需调整 Token 拿取逻辑：除原本的 HTTP `authorization` Header 之外，需要主动探测并解析 Nginx 附加带回的原始 URL (`x-original-uri`)。如果原地址包含 `?token=xxx` 的参数，则提取该 `token` 并执行权限验证。

#### Scenario: 合法的带 Authorization 头请求
- **WHEN** 通用场景下的系统发起带合法 `authorization: Bearer <Token>` Header 到该接口
- **THEN** 后端进行解析，验证通过返回 200 及 `Result`。

#### Scenario: 使用原生 `<video>` 携带 URL ?token 查询字段时的提取鉴权
- **WHEN** 当视频从 `src="http...xxx.mp4?token=jwt_code_here"` 请求进入导致 Header 极简且没有 `authorization` 字段，但是 Nginx 发往内部的 `checkFilePermission` 带上了形如 `x-original-uri: /fileStore/schools/xxx.mp4?token=jwt_code_here`
- **THEN** 代码自动降级识别 Header 参数 `x-original-uri`，用 URL 解析器切分参数获取此 `token` 并执行权限验证。

#### Scenario: Token 无效或凭证为空
- **WHEN** 请求中既没有有效 `authorization` Header 也没有有效 Query 参数中的 `token`
- **THEN** 后端抛出相关 HttpException（401 Unauthorized）。
