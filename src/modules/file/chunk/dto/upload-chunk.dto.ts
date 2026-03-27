import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UploadChunkDto {
  @ApiProperty({ description: '上传任务ID', example: 'uuid-v4-string' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: '分片索引（从0开始）', example: 0 })
  @IsNumber()
  @Min(0)
  chunkIndex: number;
}
