import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class InitChunkDto {
  @ApiProperty({ description: '文件MD5哈希值', example: 'abc123def456...' })
  @IsString()
  @IsNotEmpty()
  fileHash: string;

  @ApiProperty({ description: '原始文件名', example: 'lecture01.mp4' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: '文件总大小（bytes）', example: 524288000 })
  @IsNumber()
  @IsPositive()
  fileSize: number;

  @ApiProperty({ description: '分片总数', example: 50 })
  @IsNumber()
  @IsPositive()
  totalChunks: number;
}
