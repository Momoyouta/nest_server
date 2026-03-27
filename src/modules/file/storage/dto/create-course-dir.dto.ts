import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDirDto {
  @ApiProperty({ description: '学校ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ description: '课程ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
