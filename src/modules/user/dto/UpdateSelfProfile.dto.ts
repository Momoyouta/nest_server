import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateBasicProfileDto {
  @ApiProperty({ description: '性别（true 男，false 女）', example: true })
  @IsBoolean({ message: 'sex 必须为布尔值' })
  sex: boolean;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: '旧密码', example: 'OldPass123!' })
  @IsString({ message: 'oldPassword 必须为字符串' })
  @IsNotEmpty({ message: 'oldPassword 不能为空' })
  @MinLength(6, { message: 'oldPassword 长度不能少于 6 位' })
  oldPassword: string;

  @ApiProperty({ description: '新密码', example: 'NewPass123!' })
  @IsString({ message: 'newPassword 必须为字符串' })
  @IsNotEmpty({ message: 'newPassword 不能为空' })
  @MinLength(6, { message: 'newPassword 长度不能少于 6 位' })
  newPassword: string;
}

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'uploadImageTemp 返回的临时图片相对路径',
    example: 'uploads/temp/images/abc123.png',
  })
  @IsString({ message: 'tempAvatarPath 必须为字符串' })
  @IsNotEmpty({ message: 'tempAvatarPath 不能为空' })
  tempAvatarPath: string;
}

export class UpdatePhoneDto {
  @ApiProperty({ description: '新手机号', example: '13800138000' })
  @IsString({ message: 'newPhone 必须为字符串' })
  @Matches(/^1\d{10}$/, {
    message: 'newPhone 必须为 11 位手机号',
  })
  newPhone: string;

  @ApiPropertyOptional({
    description: '短信验证码（不传时触发发送验证码流程）',
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: 'code 必须为字符串' })
  @Matches(/^\d{6}$/, { message: 'code 必须为 6 位数字' })
  code?: string;
}

export class UpdateBasicProfileResponseDto {
  @ApiProperty({ description: '用户ID' })
  userId: string;

  @ApiProperty({ description: '性别（true 男，false 女）' })
  sex: boolean;
}

export class UpdatePasswordResponseDto {
  @ApiProperty({ description: '是否更新成功', example: true })
  updated: boolean;
}

export class UpdateAvatarResponseDto {
  @ApiProperty({
    description: '头像路径',
    example: 'users/avatars/user-id.png',
  })
  avatar: string;
}

export class UpdatePhoneResponseDto {
  @ApiPropertyOptional({ description: '验证码是否已发送', example: true })
  sent?: boolean;

  @ApiPropertyOptional({ description: '验证码过期时间（秒）', example: 300 })
  expireInSeconds?: number;

  @ApiPropertyOptional({ description: '是否更新成功', example: true })
  updated?: boolean;

  @ApiPropertyOptional({
    description: '更新后的手机号',
    example: '13800138000',
  })
  phone?: string;
}
