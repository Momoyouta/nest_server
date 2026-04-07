import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignmentStatisticsDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: '教学组ID', required: false })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;
}
