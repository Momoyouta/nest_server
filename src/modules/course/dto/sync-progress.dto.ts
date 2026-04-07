import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min, IsOptional } from 'class-validator';

export class SyncProgressDto {
  @ApiProperty({ description: '课程ID', required: true })
  @IsNotEmpty({ message: '课程ID不能为空' })
  @IsString({ message: '课程ID必须为字符串' })
  courseId: string;

  @ApiProperty({ description: '章节ID', required: true })
  @IsNotEmpty({ message: '章节ID不能为空' })
  @IsString({ message: '章节ID必须为字符串' })
  chapterId: string;

  @ApiProperty({ description: '课时ID', required: true })
  @IsNotEmpty({ message: '课时ID不能为空' })
  @IsString({ message: '课时ID必须为字符串' })
  lessonId: string;

  @ApiPropertyOptional({ description: '学校ID (已废弃)', required: false })
  @IsOptional()
  @IsString({ message: '学校ID必须为字符串' })
  schoolId?: string;

  @ApiProperty({ description: '播放进度百分比', example: 50, required: true })
  @IsNotEmpty({ message: '播放进度百分比不能为空' })
  @IsNumber({}, { message: '播放进度百分比必须为数字' })
  @Min(0, { message: '进度不能小于0' })
  @Max(100, { message: '进度不能大于100' })
  progress_percent: number;
}
