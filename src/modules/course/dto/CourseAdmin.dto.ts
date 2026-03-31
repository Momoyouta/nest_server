import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourseStatusMap, CourseStatusValues } from '@/common/utils/course.map';

export class CreateCourseDto {
  @ApiProperty({ description: '课程名称', example: '高等数学一' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: '学校ID，平台管理员必填',
    example: 'school-uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;

  @ApiPropertyOptional({
    description: '课程封面图',
    example: '/fileStore/course/cover/a.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_img?: string;

  @ApiPropertyOptional({
    description: '课程描述',
    example: '本课程讲解高等数学基础知识。',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCourseDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: '课程名称', example: '高等数学二' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: '课程封面图',
    example: '/fileStore/course/cover/b.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_img?: string;

  @ApiPropertyOptional({ description: '课程描述', example: '课程描述更新' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
    example: CourseStatusMap.PUBLISHED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(CourseStatusValues)
  status?: number;
}

export class CourseDeleteParamDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class CourseListQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '课程名称关键词', example: '数学' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
    example: CourseStatusMap.UNPUBLISHED,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(CourseStatusValues)
  status?: number;

  @ApiPropertyOptional({
    description: '学校ID，平台管理员必填',
    example: 'school-uuid',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;
}

export class CourseListItemDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @ApiProperty({ description: '创建人ID' })
  creator_id: string;

  @ApiProperty({ description: '课程名称' })
  name: string;

  @ApiPropertyOptional({ description: '封面图' })
  cover_img?: string;

  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    enum: CourseStatusValues,
  })
  status: number;

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({ description: '更新时间戳(s)' })
  update_time?: string;

  @ApiProperty({ description: '章节数', example: 12 })
  chapter_count: number;

  @ApiProperty({ description: '总课时数', example: 36 })
  total_lesson_count: number;

  @ApiProperty({
    description: '任课老师姓名列表',
    type: [String],
    example: ['张三', '李四'],
  })
  @IsArray()
  teacher_names: string[];

  @ApiPropertyOptional({ description: '创建者姓名', example: '王老师' })
  creator_name?: string;
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseListItemDto)
  list: CourseListItemDto[];

  @ApiProperty({ description: '总数', example: 100 })
  @IsInt()
  total: number;
}

export class CreateCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;
}

export class UpdateCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '是否更新成功', example: true })
  updated: boolean;
}

export class DeleteCourseResponseDto {
  @ApiProperty({ description: '课程ID' })
  id: string;

  @ApiProperty({ description: '是否删除成功', example: true })
  deleted: boolean;

  @ApiProperty({
    description: '删除模式',
    enum: ['hard', 'soft'],
    example: 'hard',
  })
  mode: 'hard' | 'soft';
}
