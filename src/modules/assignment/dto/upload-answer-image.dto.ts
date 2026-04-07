import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadAnswerImageDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  question_id: string;
}
