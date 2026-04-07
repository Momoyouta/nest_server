import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StudentAssignmentListDto {
  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;
}
