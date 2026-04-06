import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class QueryFileUserDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ description: '文件名模糊搜索', required: false })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({ description: '学校ID', required: true })
  @IsNotEmpty({ message: 'schoolId 不能为空' })
  @IsString()
  schoolId: string;
}
