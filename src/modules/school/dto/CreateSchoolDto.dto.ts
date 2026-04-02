import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({ description: '学校名称' })
  @IsNotEmpty({ message: '学校名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '学校地址', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: '负责人姓名', required: false })
  @IsOptional()
  @IsString()
  charge_name?: string;

  @ApiProperty({ description: '负责人电话', required: false })
  @IsOptional()
  @IsString()
  charge_phone?: string;

  @ApiProperty({ description: '凭证图片URL', required: false })
  @IsOptional()
  @IsString()
  evidence_img_url?: string;

  @ApiProperty({
    description: '状态 (0: 审核中, 1: 启用, 2: 禁用)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  status?: number;
}
