import { ApiProperty } from '@nestjs/swagger';

import { BaseUserInfo } from './BaseUserInfo.dto';
import { CurrentUserProfile } from '@/modules/user/dto/CurrentUserProfile.dto';

export class UserLoginResponseDto {
  @ApiProperty({
    description: 'JWT Token',
    example: 'eyJhbGciOiJIUzI1NiIsInTk...',
  })
  token: string;

  @ApiProperty({ description: '用户完整信息', type: () => CurrentUserProfile })
  userProfile: CurrentUserProfile;
}

export class UserRegisterResponseDto extends UserLoginResponseDto {}

export class UserJwtAuthResponseDto {
  @ApiProperty({ description: '是否有效', example: true })
  valid: boolean;

  @ApiProperty({ description: '用户完整信息', type: () => CurrentUserProfile })
  userProfile: CurrentUserProfile;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Token',
    example: 'eyJhbGciOiJIUzI1NiIsInTk...',
  })
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
