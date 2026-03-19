import { ApiProperty } from '@nestjs/swagger';

import { BaseUserInfo } from './BaseUserInfo.dto';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Token', example: 'eyJhbGciOiJIUzI1NiIsInTk...' })
  token: string;

  @ApiProperty({ description: '用户基础信息', type: () => BaseUserInfo })
  baseUserInfo: BaseUserInfo;
}

export class RegisterResponseDto extends LoginResponseDto {}

export class JwtAuthResponseDto {
  @ApiProperty({ description: '是否有效', example: true })
  valid: boolean;

  @ApiProperty({ description: '用户基础信息', type: () => BaseUserInfo })
  baseUserInfo: BaseUserInfo;
}
