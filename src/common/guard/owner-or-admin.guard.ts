import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { UserService } from '@/modules/user/user.service';
import { AdminRolesMap } from '../utils/role.map';
import * as _ from 'lodash';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  constructor(
    private alsService: AsyncLocalstorageService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { userId } = this.alsService.getStore() || {};
    const targetId = request.params.userId || request.params.id; // 假设参数名为 id 或 userId

    if (!userId) return false;

    // 获取用户角色
    const userRoles = await this.userService.getUserRole(userId);
    const roleIds = userRoles.map((r) => r.id.toString());

    // 检查是否为管理员 (平台管理员)
    const isAdmin =
      _.intersection(roleIds, [AdminRolesMap.root, AdminRolesMap.admin])
        .length > 0;

    // 如果是管理员，直接放行
    if (isAdmin) return true;

    // 如果不是管理员，检查是否为本人
    // 注意：这里需要根据业务逻辑判断 targetId 对应的用户 ID
    // 如果 targetId 是 Student/Teacher 的 ID，我们需要先查出其对应的 user_id
    // 为了通用性，我们可以在具体对应的 Controller 中进一步处理，或者在这里注入注入 Service 检查

    // 暂时简单判断：如果 targetId 与 userId 一致，则放行
    // 但通常 targetId 是业务主键，所以这里需要更复杂的逻辑
    return false;
  }
}
