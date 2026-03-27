import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSchoolDirDto {
  @ApiProperty({ description: '学校ID', example: 'uuid-string' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;
}
