import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChapterLessonDirDto {
  @ApiProperty({ description: '学校ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ description: '课程ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: '章节ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ description: '课时ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;
}
