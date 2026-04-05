import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { InitChunkDto } from './init-chunk.dto';

export class InitChunkUserDto extends InitChunkDto {
  @ApiProperty({
    description: '课程ID（UUID），用于校验课程创建者身份',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
