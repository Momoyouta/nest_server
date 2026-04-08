import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@/common/decorators/role.decorator';
import { Result } from '@/database/types/result.type';
import {
  TeacherCourseGroupProgressQueryDto,
  TeacherDashboardQueryDto,
  TeacherQuestionMetricQueryDto,
} from '@/modules/statistics/dto/statistics-query.dto';
import {
  TeacherCourseGroupProgressDto,
  LessonFunnelItemDto,
  ScoreDistributionDto,
  SubmissionStatusDto,
  TeacherFillQuestionScoreRatePageDto,
  TeacherObjectiveQuestionAccuracyPageDto,
  TeacherShortAnswerQuestionScoreRatePageDto,
  TeacherTodoDto,
} from '@/modules/statistics/dto/statistics-response.dto';
import { StatisticsService } from '@/modules/statistics/statistics.service';

@ApiTags('统计看板-教师视角')
@ApiBearerAuth('access_token')
@Role('teacher')
@Controller('teacher/statistics')
export class TeacherStatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('todo')
  @ApiOperation({ summary: '教师-待办统计' })
  @ApiResponse({ status: 200, description: '获取成功', type: TeacherTodoDto })
  async getTodo(@Query() query: TeacherDashboardQueryDto) {
    const data = await this.statisticsService.getTeacherTodo(query);
    return Result.success('获取成功', data);
  }

  @Get('lesson-funnel')
  @ApiOperation({ summary: '教师-课时学习漏斗' })
  @ApiResponse({ status: 200, description: '获取成功', type: [LessonFunnelItemDto] })
  async getLessonFunnel(@Query() query: TeacherDashboardQueryDto) {
    const data = await this.statisticsService.getTeacherLessonFunnel(query);
    return Result.success('获取成功', data);
  }

  @Get('score-distribution')
  @ApiOperation({ summary: '教师-成绩分布' })
  @ApiResponse({ status: 200, description: '获取成功', type: ScoreDistributionDto })
  async getScoreDistribution(@Query() query: TeacherDashboardQueryDto) {
    const data = await this.statisticsService.getTeacherScoreDistribution(query);
    return Result.success('获取成功', data);
  }

  @Get('objective-question-accuracy')
  @ApiOperation({ summary: '教师-客观题正确率（单选/多选/判断）' })
  @ApiResponse({ status: 200, description: '获取成功', type: TeacherObjectiveQuestionAccuracyPageDto })
  async getObjectiveQuestionAccuracy(@Query() query: TeacherQuestionMetricQueryDto) {
    const data = await this.statisticsService.getTeacherObjectiveQuestionAccuracy(query);
    return Result.success('获取成功', data);
  }

  @Get('fill-question-score-rate')
  @ApiOperation({ summary: '教师-填空题得分率' })
  @ApiResponse({ status: 200, description: '获取成功', type: TeacherFillQuestionScoreRatePageDto })
  async getFillQuestionScoreRate(@Query() query: TeacherQuestionMetricQueryDto) {
    const data = await this.statisticsService.getTeacherFillQuestionScoreRate(query);
    return Result.success('获取成功', data);
  }

  @Get('short-answer-score-rate')
  @ApiOperation({ summary: '教师-简答题得分率' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: TeacherShortAnswerQuestionScoreRatePageDto,
  })
  async getShortAnswerScoreRate(@Query() query: TeacherQuestionMetricQueryDto) {
    const data = await this.statisticsService.getTeacherShortAnswerQuestionScoreRate(query);
    return Result.success('获取成功', data);
  }

  @Get('submission-status')
  @ApiOperation({ summary: '教师-提交状态追踪' })
  @ApiResponse({ status: 200, description: '获取成功', type: SubmissionStatusDto })
  async getSubmissionStatus(@Query() query: TeacherDashboardQueryDto) {
    const data = await this.statisticsService.getTeacherSubmissionStatus(query);
    return Result.success('获取成功', data);
  }

  @Get('course-group-progress')
  @ApiOperation({ summary: '教师-课程教学组学生进度' })
  @ApiResponse({ status: 200, description: '获取成功', type: TeacherCourseGroupProgressDto })
  async getCourseGroupProgress(@Query() query: TeacherCourseGroupProgressQueryDto) {
    const data = await this.statisticsService.getTeacherCourseGroupProgress(query);
    return Result.success('获取成功', data);
  }
}
