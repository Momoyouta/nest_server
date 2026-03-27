import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({
    description: '目标子目录路径（相对于存储根目录）',
    example: 'schools/1/avatars',
  })
  @IsString()
  @IsNotEmpty()
  target: string;
}
