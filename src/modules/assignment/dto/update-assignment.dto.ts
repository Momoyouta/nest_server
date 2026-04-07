import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAssignmentDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: '作业标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '作业描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '开始时间戳(s)', required: false })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiProperty({ description: '截止时间戳(s)', required: false })
  @IsString()
  @IsOptional()
  deadline?: string;
}
