import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: '角色ID数组',
    example: ['1', '2'],
    type: [String],
  })
  @IsArray({ message: 'roleIds 必须是一个数组' })
  @IsString({ each: true, message: '每个角色 ID 必须是字符串' })
  roleIds: string[];
}
