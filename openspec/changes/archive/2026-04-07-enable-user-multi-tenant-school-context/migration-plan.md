# 多租户学校上下文（ALS）改造迁移与发布说明

## 1. 数据回填执行顺序

本次变更引入了 `user_school_identity` 实体，作为后续多租户认证及上下文中 `actor_id` 和 `actor_type` 的唯一来源。
请在部署代码前按照以下顺序执行回填脚本：

1. **执行建表 DDL**
   创建 `user_school_identity` 表及相关索引（`uk_user_school_actor`、`idx_user_school`、`idx_actor`）。
   确保数据库已应用 `src/database/migrations` 中的最新建表脚本（如有）。

2. **执行回填程序**
   可通过运行独立脚本或服务内的一次性 migration script：
   - 清理无效数据（可选，视具体脏数据情况）
   - 查询全量 `teacher` 和 `student` 数据
   - 分页写入 `user_school_identity`
   - **注意**：脚本应具备幂等性（包含 `ON DUPLICATE KEY UPDATE` 或提前判断是否存在），如果执行中断，重新运行应不受影响。

3. **数据校验**
   对 `user_school_identity` 数据条数与 `teacher` + `student` 总条数进行对账，确保用户能够在新的多租户架构下成功获取身份列表（调用 `GET /auth/schools`）。

## 2. 灰度策略

本次认证体系为两阶段登录（Pending Token -> Select School -> Business Token），涉及到前端与后端的全链路交互。

1. **用户端路由白名单**
   新系统上线初期，通过 `@AdminAuth()` 和之前的管理端认证仍然走旧逻辑，暂不影响管理员界面。
   学生和教师的前端 App 必须全量上线对应的 `login -> selectSchool` 两阶段流程才能配合后端使用新版认证。

2. **接口兼容设计（平滑过渡）**
   对于原本需要传递 `school_id`, `teacher_id`, `student_id` 的用户端接口，当前后端采用 **“可选且忽略”** 模式：
   - 客户端继续传递旧参数：不报错，直接忽略。
   - 后端逻辑：统一使用 ALS (`this.alsService.getSchoolId()`, `this.alsService.getActorId()`) 获取上下文并进行安全校验。
   
3. **分群灰度建议**
   如果在 App 端采用了动态路由下发或 API 版本号控制，可通过 Header `X-API-Version` 让特定学校或内测用户优先导流至新版两段式登录页面。未命中白名单的用户暂不可使用涉及 ALS 校验的新版 API，需同步观察错误日志（如 `应用上下文缺失，请重新登录选校` 等异常抛出情况）。

## 3. 回滚步骤

如果新版本上线后出现大面积无法登录或无法选校的情况，需执行以下紧急回滚预案：

1. **代码回滚**
   将后端代码回滚至合入本 OpenSpec `enable-user-multi-tenant-school-context` 前的上一个稳定版本。
   这会恢复：
   - 旧版 `AuthService.login` 直接签发 Business Token 的逻辑。
   - `AuthGuard` 停止对 `Pending Token` 的安全拦截及上下文注入。
   - 各类 `course.service.ts` 业务逻辑重新依赖 DTO 中的显式 `school_id/student_id` 参数。

2. **前端回滚**
   回滚学生端/教师端相关应用，重新启用旧版登录与 API 传参逻辑。

3. **数据恢复**
   废弃 `user_school_identity` 的使用（由于它是纯增加的新表，不影响原 `teacher` 和 `student` 基础表数据，回滚时可直接停用或删除该表而不造成原业务数据丢失）。

---
**附录：**
- **Pending Token 有效期**：现统一设置为 10 分钟。超过时间须引导用户重新进行第一阶段登录。
- **排他性控制**：同一用户在同一学校不可能同时拥有 `teacher` 和 `student` 身份（在代码、表结构唯一索引已双重防止）。
