import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@/common/decorators/role.decorator';
import { Result } from '@/database/types/result.type';
import {
  StudentCourseGroupLearningSummaryQueryDto,
  StudentLearningCenterQueryDto,
} from '@/modules/statistics/dto/statistics-query.dto';
import {
  ContinueLearningDto,
  GradeHistoryItemDto,
  StudentCourseGroupLearningSummaryDto,
  StudentCourseProgressItemDto,
  TodoAssignmentItemDto,
} from '@/modules/statistics/dto/statistics-response.dto';
import { StatisticsService } from '@/modules/statistics/statistics.service';

@ApiTags('统计看板-学生视角')
@ApiBearerAuth('access_token')
@Role('student')
@Controller('student/statistics')
export class StudentStatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('my-courses')
  @ApiOperation({ summary: '学生-我的课程进度' })
  @ApiResponse({ status: 200, description: '获取成功', type: [StudentCourseProgressItemDto] })
  async getMyCourses(@Query() query: StudentLearningCenterQueryDto) {
    const data = await this.statisticsService.getStudentMyCourses(query);
    return Result.success('获取成功', data);
  }

  @Get('continue-learning')
  @ApiOperation({ summary: '学生-继续学习记录' })
  @ApiResponse({ status: 200, description: '获取成功', type: ContinueLearningDto })
  async getContinueLearning(@Query() query: StudentLearningCenterQueryDto) {
    const data = await this.statisticsService.getStudentContinueLearning(query);
    return Result.success('获取成功', data);
  }

  @Get('todo-assignments')
  @ApiOperation({ summary: '学生-待办作业' })
  @ApiResponse({ status: 200, description: '获取成功', type: [TodoAssignmentItemDto] })
  async getTodoAssignments(@Query() query: StudentLearningCenterQueryDto) {
    const data = await this.statisticsService.getStudentTodoAssignments(query);
    return Result.success('获取成功', data);
  }

  @Get('grade-history')
  @ApiOperation({ summary: '学生-成绩单' })
  @ApiResponse({ status: 200, description: '获取成功', type: [GradeHistoryItemDto] })
  async getGradeHistory(@Query() query: StudentLearningCenterQueryDto) {
    const data = await this.statisticsService.getStudentGradeHistory(query);
    return Result.success('获取成功', data);
  }

  @Get('group-learning-summary')
  @ApiOperation({ summary: '学生-课程教学组学习概览' })
  @ApiResponse({ status: 200, description: '获取成功', type: StudentCourseGroupLearningSummaryDto })
  async getGroupLearningSummary(@Query() query: StudentCourseGroupLearningSummaryQueryDto) {
    const data = await this.statisticsService.getStudentCourseGroupLearningSummary(query);
    return Result.success('获取成功', data);
  }
}
