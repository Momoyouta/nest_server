import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FinishGradingDto {
  @ApiProperty({ description: '提交记录ID' })
  @IsString()
  @IsNotEmpty()
  submission_id: string;
}
