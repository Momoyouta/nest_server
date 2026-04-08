import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRolesMap } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import { SchoolOverviewQueryDto } from '@/modules/statistics/dto/statistics-query.dto';
import {
  AssetSummaryDto,
  CourseSummaryDto,
  LearningSummaryDto,
  PeopleSummaryDto,
} from '@/modules/statistics/dto/statistics-response.dto';
import { StatisticsService } from '@/modules/statistics/statistics.service';

@ApiTags('统计看板-学校视角')
@ApiBearerAuth('access_token')
@Controller('school/statistics')
export class SchoolStatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('people-summary')
  @AdminAuth()
  @Role(
    AdminRolesMap.root,
    AdminRolesMap.admin,
    AdminRolesMap.school_root,
    AdminRolesMap.school_admin,
  )
  @ApiOperation({ summary: '学校-人员概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: PeopleSummaryDto })
  async getPeopleSummary(@Query() query: SchoolOverviewQueryDto) {
    const data = await this.statisticsService.getSchoolPeopleSummary(query);
    return Result.success('获取成功', data);
  }

  @Get('course-summary')
  @AdminAuth()
  @Role(
    AdminRolesMap.root,
    AdminRolesMap.admin,
    AdminRolesMap.school_root,
    AdminRolesMap.school_admin,
  )
  @ApiOperation({ summary: '学校-课程概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: CourseSummaryDto })
  async getCourseSummary(@Query() query: SchoolOverviewQueryDto) {
    const data = await this.statisticsService.getSchoolCourseSummary(query);
    return Result.success('获取成功', data);
  }

  @Get('asset-summary')
  @AdminAuth()
  @Role(
    AdminRolesMap.root,
    AdminRolesMap.admin,
    AdminRolesMap.school_root,
    AdminRolesMap.school_admin,
  )
  @ApiOperation({ summary: '学校-教学资产概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: AssetSummaryDto })
  async getAssetSummary(@Query() query: SchoolOverviewQueryDto) {
    const data = await this.statisticsService.getSchoolAssetSummary(query);
    return Result.success('获取成功', data);
  }

  @Get('learning-summary')
  @AdminAuth()
  @Role(
    AdminRolesMap.root,
    AdminRolesMap.admin,
    AdminRolesMap.school_root,
    AdminRolesMap.school_admin,
  )
  @ApiOperation({ summary: '学校-学情概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: LearningSummaryDto })
  async getLearningSummary(@Query() query: SchoolOverviewQueryDto) {
    const data = await this.statisticsService.getSchoolLearningSummary(query);
    return Result.success('获取成功', data);
  }
}
