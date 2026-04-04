import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FileUploadScenario } from '@/common/utils/file-scenario.map';

export class UploadChunkUserDto {
  @ApiProperty({ description: '上传任务ID', example: 'uuid-v4-string' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: '分片索引（从0开始）', example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  chunkIndex: number;

  @ApiProperty({ description: '文件MD5哈希值', example: 'abcd1234efgh5678' })
  @IsString()
  @IsNotEmpty()
  fileHash: string;

  @ApiProperty({
    description: '上传业务场景',
    enum: FileUploadScenario,
    example: FileUploadScenario.AVATAR,
  })
  @IsEnum(FileUploadScenario)
  @IsNotEmpty()
  scenario: string;

  @ApiProperty({
    description: '课程ID（UUID），用于校验课程创建者身份',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: '学校ID（校本资源/课程作业场景必填）',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  schoolId?: number;

  @ApiPropertyOptional({
    description: '作业ID（部分具体作业相关上传需要）',
    example: 202,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  homeworkId?: number;
}
