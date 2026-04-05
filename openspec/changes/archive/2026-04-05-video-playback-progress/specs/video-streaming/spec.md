## MODIFIED Requirements

### Requirement: 获取视频切片流鉴权配置 (Check File Permission Adapter)
后端必须适应 Nginx 的静态文件的 `auth_request` 内部调用拦截，更新现有的 OpenAPI 鉴权接口 `GET /auth/checkFilePermission`。该接口需调整 Token 拿取逻辑：除原本的 HTTP `authorization` Header 之外，需要主动探测并解析 Nginx 附加带回的原始 URL (`x-original-uri`)。如果原地址含盖像 `?token=xxx` 的传参，则读取为鉴权凭证进行匹配与判定。

#### Scenario: 合法的带 Authorization 头请求
- **WHEN** 通用场景下的系统发起带合法 `authorization: Bearer <Token>` Header 到该接口
- **THEN** 后方进行解析，验证通过返回 200 及 `Result`。

#### Scenario: 使用原生 `<video>` 携带 URL ?token 查询字段时的提取鉴权
- **WHEN** 当视频从 `src="http...xxx.mp4?token=jwt_code_here"` 请求进入导致 Header 极简且没有 `authorization` 字段，但是 Nginx 发往内部的 `checkFilePermission` 带上了形如 `x-original-uri: /fileStore/schools/xxx.mp4?token=jwt_code_here`
- **THEN** 代码自动降级识别 Header 参数 `x-original-uri`，用 URL 解析器切分参数获取此 `token` 行执行权限验证并放行通过返回 HTTP 200。

#### Scenario: Token 无效或凭证为空
- **WHEN** 且没有有效 `authorization` 和有效 Query 参数的 `token`。
- **THEN** 后端抛出相关 HttpException（401 Unauthorized）。
