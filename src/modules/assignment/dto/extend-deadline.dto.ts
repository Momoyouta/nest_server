import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExtendDeadlineDto {
  @ApiProperty({ description: '作业ID' })
  @IsString()
  @IsNotEmpty()
  assignment_id: string;

  @ApiProperty({ description: '开始时间戳(s)' })
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @ApiProperty({ description: '截止时间戳(s)' })
  @IsString()
  @IsNotEmpty()
  deadline: string;
}
