import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeQuestionDto {
  @ApiProperty({ description: '提交记录ID' })
  @IsString()
  @IsNotEmpty()
  submission_id: string;

  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiProperty({ description: '打分分值' })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({ description: '单题评语', required: false })
  @IsString()
  @IsOptional()
  teacher_comment?: string;

  @ApiProperty({ description: '整体评语', required: false })
  @IsString()
  @IsOptional()
  overall_comment?: string;
}
