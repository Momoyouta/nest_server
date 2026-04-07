import { Body, Controller, ForbiddenException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignmentService } from '../assignment.service';
import { Role } from '@/common/decorators/role.decorator';
import { StudentAssignmentListDto } from '../dto/student-assignment-list.dto';
import { StudentAssignmentDetailDto } from '../dto/student-assignment-detail.dto';
import { SaveDraftDto } from '../dto/save-draft.dto';
import { SubmitAssignmentDto } from '../dto/submit-assignment.dto';
import { SubmissionResultDto } from '../dto/submission-result.dto';
import { UploadAnswerImageDto } from '../dto/upload-answer-image.dto';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';

@ApiTags('学生-作业')
@ApiBearerAuth()
@Role('student')
@Controller('student/assignment')
export class StudentAssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly alsService: AsyncLocalstorageService,
  ) { }

  private getUserIdOrThrow() {
    const userId = this.alsService.getUserId();
    if (!userId) throw new ForbiddenException('未登录');
    return userId;
  }

  @Post('list')
  @ApiOperation({ summary: '学生作业列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentAssignmentList(@Body() dto: StudentAssignmentListDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getStudentAssignmentList(dto, userId);
  }

  @Post('detail')
  @ApiOperation({ summary: '题目详情，过滤答案' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStudentAssignmentDetail(@Body() dto: StudentAssignmentDetailDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getStudentAssignmentDetail(dto, userId);
  }

  @Post('draft/save')
  @ApiOperation({ summary: '保存草稿' })
  @ApiResponse({ status: 200, description: '保存草稿成功' })
  async saveDraft(@Body() dto: SaveDraftDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.saveDraft(dto, userId);
  }

  @Post('submit')
  @ApiOperation({ summary: '最终提交' })
  @ApiResponse({ status: 200, description: '提交成功' })
  async submitAssignment(@Body() dto: SubmitAssignmentDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.submitAssignment(dto, userId);
  }

  @Post('result')
  @ApiOperation({ summary: '查看批改结果' })
  @ApiResponse({ status: 200, description: '获取批改结果成功' })
  async getSubmissionResult(@Body() dto: SubmissionResultDto) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.getSubmissionResult(dto, userId);
  }

  @Post('answer/image/upload')
  @ApiOperation({ summary: '学生上传作答图片(简答题)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: '上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnswerImage(
    @Body() dto: UploadAnswerImageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = this.getUserIdOrThrow();
    return this.assignmentService.uploadAnswerImage(file, dto, userId);
  }
}
