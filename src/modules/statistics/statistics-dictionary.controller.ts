import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRolesMap } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import { StatisticsDictionaryQueryDto } from '@/modules/statistics/dto/statistics-query.dto';
import { StatisticsDictionaryDto } from '@/modules/statistics/dto/statistics-response.dto';
import { StatisticsService } from '@/modules/statistics/statistics.service';

@ApiTags('统计看板-字典')
@ApiBearerAuth('access_token')
@Controller('admin/statistics')
export class StatisticsDictionaryController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dictionary')
  @AdminAuth()
  @Role(
    AdminRolesMap.root,
    AdminRolesMap.admin,
    AdminRolesMap.school_root,
    AdminRolesMap.school_admin,
  )
  @ApiOperation({ summary: '统计指标字典' })
  @ApiResponse({ status: 200, description: '获取成功', type: StatisticsDictionaryDto })
  async getDictionary(@Query() query: StatisticsDictionaryQueryDto) {
    const data = await this.statisticsService.getStatisticsDictionary(query);
    return Result.success('获取成功', data);
  }
}
