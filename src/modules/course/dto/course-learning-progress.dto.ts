import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetCourseLearningProgressDto {
  @ApiProperty({ description: '课程ID', required: true })
  @IsNotEmpty({ message: '课程ID不能为空' })
  @IsString({ message: '课程ID必须为字符串' })
  courseId: string;

  @ApiProperty({ description: '学校ID', required: true })
  @IsNotEmpty({ message: '学校ID不能为空' })
  @IsString({ message: '学校ID必须为字符串' })
  schoolId: string;
}

export class LessonProgressDto {
  @ApiProperty({ description: '课时ID' })
  lesson_id: string;

  @ApiProperty({ description: '课时标题' })
  lesson_title: string;

  @ApiProperty({ description: '播放进度百分比' })
  progress_percent: number;

  @ApiProperty({ description: '学习次数' })
  learn_count: number;

  @ApiProperty({ description: '是否已学完' })
  is_completed: number;

  @ApiProperty({ description: '最后学习时间戳(s)', nullable: true })
  last_learn_time: string | null;
}

export class ChapterProgressDto {
  @ApiProperty({ description: '章节ID' })
  chapter_id: string;

  @ApiProperty({ description: '章节标题' })
  chapter_title: string;

  @ApiProperty({ description: '章节总课时数' })
  total_lessons: number;

  @ApiProperty({ description: '章节已完成课时数' })
  completed_lessons: number;

  @ApiProperty({ description: '课时进度详情', type: [LessonProgressDto] })
  lessons: LessonProgressDto[];
}

export class CourseLearningProgressResponseDto {
  @ApiProperty({ description: '总课时数' })
  total_lessons: number;

  @ApiProperty({ description: '总完成课时数' })
  total_completed: number;

  @ApiProperty({ description: '章节进度列表', type: [ChapterProgressDto] })
  chapter_progress: ChapterProgressDto[];
}
