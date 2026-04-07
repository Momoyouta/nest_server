import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignmentListDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '教学组ID', required: false })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;
}
