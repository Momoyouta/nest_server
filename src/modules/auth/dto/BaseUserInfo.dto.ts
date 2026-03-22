import { ApiProperty } from '@nestjs/swagger';

export class BaseUserInfo {
  @ApiProperty({ description: '用户ID', example: '123456' })
  userId: string;

  @ApiProperty({ description: '用户角色列表', example: ['admin', 'user'] })
  userRoles: string[];

  @ApiProperty({ description: '用户名称', example: '张三' })
  userName: string;

  @ApiProperty({ description: '学校ID', example: '1', required: false })
  schoolId?: string;
}
