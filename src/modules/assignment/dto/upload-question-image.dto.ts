import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { QuestionResourceTypeValues } from '@/common/utils/assignment.map';

export class UploadQuestionImageDto {
  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '资源类型(1-题干图片, 2-解析图片)', enum: QuestionResourceTypeValues })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  resource_type: number;
}
