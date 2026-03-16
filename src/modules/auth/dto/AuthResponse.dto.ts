import { ApiProperty } from '@nestjs/swagger';

export class BaseUserInfo {
  @ApiProperty({ description: '用户ID', example: '123456' })
  userId: string;

  @ApiProperty({ description: '用户角色列表', example: ['admin', 'user'] })
  userRoles: string[];

  @ApiProperty({ description: '用户名称', example: '张三' })
  userName: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Token', example: 'eyJhbGciOiJIUzI1NiIsInTk...' })
  token: string;

  @ApiProperty({ description: '用户基础信息' })
  baseUserInfo: BaseUserInfo;
}

export class RegisterResponseDto extends LoginResponseDto {}

export class JwtAuthResponseDto {
  @ApiProperty({ description: '是否有效', example: true })
  valid: boolean;

  @ApiProperty({ description: '用户基础信息' })
  baseUserInfo: BaseUserInfo;
}
