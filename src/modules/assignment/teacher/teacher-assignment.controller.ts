import { Body, Controller, ForbiddenException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignmentService } from '../assignment.service';
import { Role } from '@/common/decorators/role.decorator';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { SaveAssignmentDto } from '../dto/save-assignment.dto';
import { PublishAssignmentDto } from '../dto/publish-assignment.dto';
import { ExtendDeadlineDto } from '../dto/extend-deadline.dto';
import { AssignmentListDto } from '../dto/assignment-list.dto';
import { AssignmentDetailDto } from '../dto/assignment-detail.dto';
import { AssignmentStatisticsDto } from '../dto/assignment-statistics.dto';
import { GradeQuestionDto } from '../dto/grade-question.dto';
import { AssignmentSubmissionsDto } from '../dto/assignment-submissions.dto';
import { UploadQuestionImageDto } from '../dto/upload-question-image.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';

@ApiTags('教师-作业管理')
@ApiBearerAuth()
@Role('teacher')
@Controller('teacher/assignment')
export class TeacherAssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly alsService: AsyncLocalstorageService,
  ) { }

  private getUserIdOrThrow() {
    const userId = this.alsService.getUserId();
    if (!userId) throw new ForbiddenException('未登录');
    return userId;
  }

  @Post('save')
  @ApiOperation({ summary: '保存草稿' })
  @ApiResponse({ status: 200, description: '保存成功' })
  async saveAssignment(@Body() dto: SaveAssignmentDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.saveAssignment(dto, userId);
  }

  @Post('update')
  @ApiOperation({ summary: '修改作业基础信息(标题/描述/时间)' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async updateAssignment(@Body() dto: UpdateAssignmentDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.updateAssignment(dto, userId);
  }

  @Post('publish')
  @ApiOperation({ summary: '发布作业' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publishAssignment(@Body() dto: PublishAssignmentDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.publishAssignment(dto, userId);
  }

  @Post('deadline/extend')
  @ApiOperation({ summary: '调整时间' })
  @ApiResponse({ status: 200, description: '调整时间成功' })
  async extendDeadline(@Body() dto: ExtendDeadlineDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.extendDeadline(dto, userId);
  }

  @Post('list')
  @ApiOperation({ summary: '作业列表' })
  @ApiResponse({ status: 200, description: '获取作业列表成功' })
  async getAssignmentList(@Body() dto: AssignmentListDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getAssignmentList(dto, userId);
  }

  @Post('detail')
  @ApiOperation({ summary: '作业详情含答案' })
  @ApiResponse({ status: 200, description: '获取作业详情成功' })
  async getAssignmentDetail(@Body() dto: AssignmentDetailDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getAssignmentDetail(dto, userId);
  }

  @Post('overview')
  @ApiOperation({ summary: '作业基本信息概览(供统计使用)' })
  @ApiResponse({ status: 200, description: '获取概览成功' })
  async getAssignmentOverview(@Body() dto: AssignmentDetailDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getAssignmentOverview(dto, userId);
  }

  @Post('statistics')
  @ApiOperation({ summary: '全量统计数据' })
  @ApiResponse({ status: 200, description: '获取统计成功' })
  async getStatistics(@Body() dto: AssignmentStatisticsDto) {
    return this.assignmentService.getStatistics(dto);
  }

  @Post('grade')
  @ApiOperation({ summary: '手动批改' })
  @ApiResponse({ status: 200, description: '批改成功' })
  async gradeQuestion(@Body() dto: GradeQuestionDto) {
    return this.assignmentService.gradeQuestion(dto);
  }

  @Post('submissions')
  @ApiOperation({ summary: '学生提交列表' })
  @ApiResponse({ status: 200, description: '获取提交列表成功' })
  async getSubmissions(@Body() dto: AssignmentSubmissionsDto) {
    return this.assignmentService.getSubmissions(dto);
  }

  @Post('question/image/upload')
  @ApiOperation({ summary: '上传题目图片' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadQuestionImage(
    @Body() dto: UploadQuestionImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assignmentService.uploadQuestionImage(file, dto);
  }
}
