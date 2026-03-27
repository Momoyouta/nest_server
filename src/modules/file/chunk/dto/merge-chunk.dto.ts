import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MergeChunkDto {
  @ApiProperty({ description: '上传任务ID', example: 'uuid-v4-string' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: '文件SHA-256哈希值', example: 'abc123def456...' })
  @IsString()
  @IsNotEmpty()
  fileHash: string;

  @ApiProperty({
    description: '目标存储相对路径',
    example: 'schools/1/courses/2/chapters/3/lessons/4',
  })
  @IsString()
  @IsNotEmpty()
  targetPath: string;
}
