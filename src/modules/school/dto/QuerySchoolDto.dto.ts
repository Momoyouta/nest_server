import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySchoolDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页条数', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({ description: '学校ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiProperty({ description: '学校名称 (模糊查询)', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '负责人姓名 (模糊查询)', required: false })
  @IsOptional()
  @IsString()
  charge_name?: string;

  @ApiProperty({ description: '负责人电话 (模糊查询)', required: false })
  @IsOptional()
  @IsString()
  charge_phone?: string;

  @ApiProperty({
    description: '状态 (0: 审核中, 1: 启用, 2: 禁用)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}
