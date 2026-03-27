import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QuerySchoolApplicationDto {
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

  @ApiProperty({ description: '审核状态(0待审核,1通过,2驳回)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiProperty({ description: '学校名称(模糊查询)', required: false })
  @IsOptional()
  @IsString()
  school_name?: string;

  @ApiProperty({ description: '负责人手机号(模糊查询)', required: false })
  @IsOptional()
  @IsString()
  charge_phone?: string;
}
