import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { PlatformAdminRoles } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import { PlatformOverviewQueryDto } from '@/modules/statistics/dto/statistics-query.dto';
import {
  CourseSummaryDto,
  PlatformSchoolTotalDto,
  PlatformUserTotalDto,
  SchoolFunnelDto,
  StorageUsageDto,
} from '@/modules/statistics/dto/statistics-response.dto';
import { StatisticsService } from '@/modules/statistics/statistics.service';

@ApiTags('统计看板-平台视角')
@ApiBearerAuth('access_token')
@Controller('admin/statistics/platform')
export class PlatformStatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('school-funnel')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '平台-学校入驻漏斗' })
  @ApiResponse({ status: 200, description: '获取成功', type: SchoolFunnelDto })
  async getSchoolFunnel(@Query() query: PlatformOverviewQueryDto) {
    const data = await this.statisticsService.getPlatformSchoolFunnel(query);
    return Result.success('获取成功', data);
  }

  @Get('school-total')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '平台-学校总数' })
  @ApiResponse({ status: 200, description: '获取成功', type: PlatformSchoolTotalDto })
  async getSchoolTotal(@Query() query: PlatformOverviewQueryDto) {
    const data = await this.statisticsService.getPlatformSchoolTotal(query);
    return Result.success('获取成功', data);
  }

  @Get('user-total')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '平台-用户规模' })
  @ApiResponse({ status: 200, description: '获取成功', type: PlatformUserTotalDto })
  async getUserTotal(@Query() query: PlatformOverviewQueryDto) {
    const data = await this.statisticsService.getPlatformUserTotal(query);
    return Result.success('获取成功', data);
  }

  @Get('storage-usage')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '平台-存储使用情况' })
  @ApiResponse({ status: 200, description: '获取成功', type: StorageUsageDto })
  async getStorageUsage(@Query() query: PlatformOverviewQueryDto) {
    const data = await this.statisticsService.getPlatformStorageUsage(query);
    return Result.success('获取成功', data);
  }

  @Get('course-summary')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '平台-课程概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: CourseSummaryDto })
  async getCourseSummary(@Query() query: PlatformOverviewQueryDto) {
    const data = await this.statisticsService.getPlatformCourseSummary(query);
    return Result.success('获取成功', data);
  }
}
