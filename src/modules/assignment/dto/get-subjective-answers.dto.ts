import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetSubjectiveAnswersDto {
  @ApiProperty({ description: '提交记录ID' })
  @IsString()
  @IsNotEmpty()
  submission_id: string;
}
