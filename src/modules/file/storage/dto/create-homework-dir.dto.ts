import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHomeworkDirDto {
  @ApiProperty({ description: '学校ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ description: '课程ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: '作业ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  homeworkId: string;

  @ApiProperty({ description: '提交ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  submitId: string;
}
