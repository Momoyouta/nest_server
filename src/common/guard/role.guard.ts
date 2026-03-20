import { UserService } from './../../modules/user/user.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/constants/decoratorKey';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import * as _ from 'lodash';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userService: UserService,
    private alsService: AsyncLocalstorageService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器定义的角色要求 (例如: @Role('admin'))
    const role = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    // 从 AsyncLocalStorage 获取当前用户的 userId
    const { userId } = this.alsService.getStore() || {};

    // 如果接口没有设置角色要求，则允许访问
    if (!role || role.length === 0) {
      return true;
    }
    if (userId) {
      // 通过 UserService 查询用户的角色详细信息
      const userRoles = await this.userService.getUserRole(userId);
      // 将角色实体映射为包含 ID 和 nameEN 的标识数组
      const userRoleIdentifiers = _.flatten(
        userRoles.map((r) => [r.id.toString(), r.nameEN]),
      );
      console.log('Required roles:', role);
      console.log('User role identifiers:', userRoleIdentifiers);
      // 使用 lodash.intersection 判断用户角色标识与接口要求角色是否有交集
      return _.intersection(userRoleIdentifiers, role).length > 0;
    }
    console.log(role, userId)
    // 若未登录或无 userId，则禁止访问
    return false;
  }
}
