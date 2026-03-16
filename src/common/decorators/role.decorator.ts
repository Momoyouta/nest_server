import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { API_PUBLIC, ROLES_KEY } from '@/common/constants/decoratorKey';
import { RoleGuard } from '../guard/role.guard';
export const Public = () => SetMetadata(API_PUBLIC, true);
export function Role(...roles: string[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RoleGuard));
}
