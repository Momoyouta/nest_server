import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CourseAssignmentQuestionTypeValues } from '@/common/utils/course.map';

export class QuestionItemDto {
  @ApiProperty({ description: '题目ID(已有的话传入)', required: false })
  @IsString()
  @IsOptional()
  question_id?: string;

  @ApiProperty({ description: '题型(1-单选,2-多选,3-判断,4-填空,5-简答)', enum: CourseAssignmentQuestionTypeValues })
  @IsInt()
  @IsEnum(CourseAssignmentQuestionTypeValues)
  type: number;

  @ApiProperty({ description: '分值' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({ description: '题目内容', type: Object, additionalProperties: true })
  @IsNotEmpty()
  content: any;

  @ApiProperty({ description: '标准答案', type: Object, additionalProperties: true })
  @IsNotEmpty()
  standard_answer: any;

  @ApiProperty({ description: '排序值' })
  @IsInt()
  sort_order: number;

  @ApiProperty({ description: '题目解析', required: false, type: Object, additionalProperties: true })
  @IsOptional()
  analysis?: any;
}

export class SaveAssignmentDto {
  @ApiProperty({ description: '作业ID(更新草稿时传入)', required: false })
  @IsString()
  @IsOptional()
  assignment_id?: string;

  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '教学组ID(可选)', required: false })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;

  @ApiProperty({ description: '作业标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '作业描述(可选)', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '开始时间戳(s)' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ description: '截止时间戳(s)' })
  @IsString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty({ description: '题目列表(至少1题)', type: [QuestionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionItemDto)
  questions: QuestionItemDto[];
}
