import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignmentSubmissionsDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiPropertyOptional({ description: '教学组ID' })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;

  @ApiPropertyOptional({ description: '学生姓名关键字' })
  @IsString()
  @IsOptional()
  studentName?: string;

  @ApiPropertyOptional({ description: '是否已批改(1-已批改, 0-待批改)' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  isGraded?: number;

  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 10;
}
