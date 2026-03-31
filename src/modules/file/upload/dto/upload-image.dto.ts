import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { FileUploadScenario } from '../../../../common/utils/file-scenario.map'

export class UploadImageDto {

  @ApiPropertyOptional({ description: '学校ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  schoolId?: number;

  @ApiProperty({
    description: '上传业务场景',
    enum: FileUploadScenario,
    enumName: 'FileUploadScenario',
    example: FileUploadScenario.AVATAR
  })
  @IsEnum(FileUploadScenario)
  @IsNotEmpty()
  scenario: string;

  @ApiPropertyOptional({ description: '课程ID', example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  courseId?: number;

  @ApiPropertyOptional({ description: '作业ID', example: 202 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  homeworkId?: number;
}
