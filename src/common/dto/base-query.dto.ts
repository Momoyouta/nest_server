import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseQueryDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '关键词查询' })
  keyword?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  schoolId?: string;

  @ApiPropertyOptional({ description: '学院ID (兼容历史版本)' })
  school_id?: string;

  @ApiPropertyOptional({ description: '学院名称' })
  collegeName?: string;
}
