- [x] 在 `src/database/entities/invitation_code.entity.ts` 中创建 `InvitationCode` 实体。
- [x] 将实体注册到 `src/modules/common/common/common.module.ts`。
- [x] 在 `src/common/dto/invite.dto.ts` 中更新 `InvitationDataDto` 和 `CreateInviteDto` (改为 `grade`)。
- [x] 新增 `InvitationQueryDto` 定义。
- [x] 将邀请码生成逻辑改为 16 位唯一码。
- [x] 为 `InvitationCode` 实体添加 `ttl` 字段并同步逻辑。
- [x] 在 `InvitationService` 中迁移存储逻辑到 MySQL。
- [x] 实现 `deleteInvite` 方法。
- [x] 实现 `findAll` 方法，支持分页及多条件过滤，并完成学校名和创建人名的关联查询。
- [x] 在 `InvitationController` 中暴露端点：`GET /admin/invite` 和 `DELETE /admin/invite/:code`。

## 3. 用户服务及认证更新 (按新参数)
- [x] 更新 `UserService.createStudentWithUser` 以适配 `grade` 参数。
- [x] 更新 `AuthService.register` 以改为从数据库校验邀请码。

## 4. 验证
- [x] 测试分页查询及其各项过滤条件。
- [x] 测试删除功能。
- [x] 验证注册流程中的 `grade` 数据存储正确。
