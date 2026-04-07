import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class AnswerItemDto {
  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: '作答内容', type: Object, additionalProperties: true })
  @IsNotEmpty()
  student_answer: any;
}

export class SaveDraftDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: '作答列表', type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
