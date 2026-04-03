import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { AllJwtAuth } from '@/common/decorators/auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRoles } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import {
  BindTeachingGroupTeachersAdminDto,
  BindTeachingGroupTeachersAdminResponseDto,
  CourseOutlineDraftDto,
  CourseDeleteParamDto,
  CourseLessonOutlineQueryDto,
  CourseListQueryDto,
  CourseListResponseDto,
  CreateTeachingGroupAdminDto,
  CreateTeachingGroupAdminResponseDto,
  CreateCourseDto,
  CreateCourseResponseDto,
  DeleteTeachingGroupAdminResponseDto,
  DeleteCourseResponseDto,
  GetTeachingGroupAdminResponseDto,
  ListTeachingGroupAdminQueryDto,
  ListTeachingGroupAdminResponseDto,
  PublishCourseOutlineDto,
  PublishCourseOutlineResponseDto,
  QuerySchoolTeacherByNameAdminDto,
  QuerySchoolTeacherByNameAdminResponseDto,
  QuickUpdateChapterTitleDto,
  QuickUpdateChapterTitleResponseDto,
  QuickUpdateLessonDto,
  QuickUpdateLessonResponseDto,
  SaveCourseDraftDto,
  SaveCourseDraftResponseDto,
  TeachingGroupIdParamDto,
  UpdateTeachingGroupAdminDto,
  UpdateTeachingGroupAdminResponseDto,
  UpdateCourseDto,
  UpdateCourseCoverDto,
  UpdateCourseResponseDto,
} from '@/modules/course/dto/CourseAdmin.dto';
import { CourseService } from '@/modules/course/course.service';

@ApiTags('课程管理')
@ApiBearerAuth('access_token')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('createCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员创建课程' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateCourseResponseDto,
  })
  async createCourseAdmin(@Body() payload: CreateCourseDto) {
    const data = await this.courseService.createCourseAdmin(payload);
    return Result.success('创建成功', data);
  }

  @Post('createTeachingGroupAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '创建教学组' })
  @ApiBody({ type: CreateTeachingGroupAdminDto })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateTeachingGroupAdminResponseDto,
  })
  async createTeachingGroupAdmin(@Body() payload: CreateTeachingGroupAdminDto) {
    const data = await this.courseService.createTeachingGroupAdmin(payload);
    return Result.success('创建成功', data);
  }

  @Get('listTeachingGroupAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '分页查询课程教学组' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: ListTeachingGroupAdminResponseDto,
  })
  async listTeachingGroupAdmin(@Query() query: ListTeachingGroupAdminQueryDto) {
    const data = await this.courseService.listTeachingGroupAdmin(query);
    return Result.success('查询成功', data);
  }

  @Get('getTeachingGroupAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '查询教学组详情' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: GetTeachingGroupAdminResponseDto,
  })
  async getTeachingGroupAdmin(@Param() params: TeachingGroupIdParamDto) {
    const data = await this.courseService.getTeachingGroupAdmin(params.id);
    return Result.success('查询成功', data);
  }

  @Put('updateTeachingGroupAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '更新教学组' })
  @ApiBody({ type: UpdateTeachingGroupAdminDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateTeachingGroupAdminResponseDto,
  })
  async updateTeachingGroupAdmin(@Body() payload: UpdateTeachingGroupAdminDto) {
    const data = await this.courseService.updateTeachingGroupAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Delete('deleteTeachingGroupAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '删除教学组' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteTeachingGroupAdminResponseDto,
  })
  async deleteTeachingGroupAdmin(@Param() params: TeachingGroupIdParamDto) {
    const data = await this.courseService.deleteTeachingGroupAdmin(params.id);
    return Result.success('删除成功', data);
  }

  @Put('updateCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({
    summary: '管理员更新课程（包含 name、cover_img、status、description）',
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateCourseResponseDto,
  })
  async updateCourseAdmin(@Body() payload: UpdateCourseDto) {
    const data = await this.courseService.updateCourseAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Post('saveCourseDraftAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '保存课程大纲草稿（仅覆盖 draft_content）' })
  @ApiBody({ type: SaveCourseDraftDto })
  @ApiResponse({
    status: 200,
    description: '保存成功',
    type: SaveCourseDraftResponseDto,
  })
  async saveCourseDraftAdmin(@Body() payload: SaveCourseDraftDto) {
    const data = await this.courseService.saveCourseDraftAdmin(payload);
    return Result.success('保存成功', data);
  }

  @Post('publishCourseOutlineAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({
    summary: '发布课程大纲（覆盖草稿并按 diff 同步章节课时）',
  })
  @ApiBody({ type: PublishCourseOutlineDto })
  @ApiResponse({
    status: 200,
    description: '发布成功',
    type: PublishCourseOutlineResponseDto,
  })
  async publishCourseOutlineAdmin(@Body() payload: PublishCourseOutlineDto) {
    const data = await this.courseService.publishCourseOutlineAdmin(payload);
    return Result.success('发布成功', data);
  }

  @Put('updateChapterTitleQuickAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '快捷更新章节标题（覆盖草稿并更新章节表）' })
  @ApiBody({ type: QuickUpdateChapterTitleDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: QuickUpdateChapterTitleResponseDto,
  })
  async updateChapterTitleQuickAdmin(
    @Body() payload: QuickUpdateChapterTitleDto,
  ) {
    const data = await this.courseService.updateChapterTitleQuickAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Put('updateLessonQuickAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '快捷更新课时（覆盖草稿并更新课时表）' })
  @ApiBody({ type: QuickUpdateLessonDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: QuickUpdateLessonResponseDto,
  })
  async updateLessonQuickAdmin(@Body() payload: QuickUpdateLessonDto) {
    const data = await this.courseService.updateLessonQuickAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Put('bindTeachingGroupTeachersAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '绑定教学组任课老师（覆盖式同步）' })
  @ApiBody({ type: BindTeachingGroupTeachersAdminDto })
  @ApiResponse({
    status: 200,
    description: '绑定成功',
    type: BindTeachingGroupTeachersAdminResponseDto,
  })
  async bindTeachingGroupTeachersAdmin(
    @Body() payload: BindTeachingGroupTeachersAdminDto,
  ) {
    const data =
      await this.courseService.bindTeachingGroupTeachersAdmin(payload);
    return Result.success('绑定成功', data);
  }

  @Get('querySchoolTeacherByNameAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '按本校与姓名前缀查询老师' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: QuerySchoolTeacherByNameAdminResponseDto,
  })
  async querySchoolTeacherByNameAdmin(
    @Query() query: QuerySchoolTeacherByNameAdminDto,
  ) {
    const data = await this.courseService.querySchoolTeacherByNameAdmin(query);
    return Result.success('查询成功', data);
  }

  @Get('getCourseLessonOutline/:id')
  @AllJwtAuth()
  @ApiOperation({
    summary: '查询课程课时大纲（admin优先草稿，user查询发布态）',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CourseOutlineDraftDto,
  })
  async getCourseLessonOutline(
    @Param() params: CourseDeleteParamDto,
    @Query() query: CourseLessonOutlineQueryDto,
  ) {
    const data = await this.courseService.getCourseLessonOutline(
      params.id,
      query.source,
    );
    return Result.success('查询成功', data);
  }

  @Get('importPublishedCourseLessonOutlineAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '导入当前已发布内容大纲（管理端）' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CourseOutlineDraftDto,
  })
  async importPublishedCourseLessonOutlineAdmin(
    @Param() params: CourseDeleteParamDto,
  ) {
    const data =
      await this.courseService.importPublishedCourseLessonOutlineAdmin(
        params.id,
      );
    return Result.success('查询成功', data);
  }

  @Put('updateCourseCoverAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '单独更新课程封面' })
  @ApiBody({ type: UpdateCourseCoverDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateCourseResponseDto,
  })
  async updateCourseCoverAdmin(@Body() payload: UpdateCourseCoverDto) {
    const data = await this.courseService.updateCourseCoverAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Delete('hardDeleteCourseAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员硬删除课程并清理关联数据' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteCourseResponseDto,
  })
  async hardDeleteCourseAdmin(@Param() params: CourseDeleteParamDto) {
    const data = await this.courseService.hardDeleteCourseAdmin(params.id);
    return Result.success('删除成功', data);
  }

  @Put('softDeleteCourseAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员软删除课程(改为未发布)' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteCourseResponseDto,
  })
  async softDeleteCourseAdmin(@Param() params: CourseDeleteParamDto) {
    const data = await this.courseService.softDeleteCourseAdmin(params.id);
    return Result.success('删除成功', data);
  }

  @Get('getCourseBasicAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员获取单个课程基础信息' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '查询成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            school_id: { type: 'string' },
            school_name: { type: 'string' },
            creator_id: { type: 'string' },
            creator_name: { type: 'string' },
            name: { type: 'string' },
            cover_img: { type: 'string' },
            status: { type: 'number', enum: [0, 1] },
            create_time: { type: 'string' },
            update_time: { type: 'string' },
            teacher_names: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async getCourseBasicAdmin(@Param() params: CourseDeleteParamDto) {
    return Result.success(
      '查询成功',
      await this.courseService.getCourseBasicAdmin(params.id),
    );
  }

  @Get('listCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员分页查询课程列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CourseListResponseDto,
  })
  async listCourseAdmin(@Query() query: CourseListQueryDto) {
    const data = await this.courseService.listCourseAdmin(query);
    return Result.success('查询成功', data);
  }

  @Get('getCourseDescription/:id')
  @AllJwtAuth()
  @ApiOperation({ summary: '获取课程简介' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '查询成功' },
        data: {
          type: 'object',
          properties: {
            description: { type: 'string' },
          },
        },
      },
    },
  })
  async getCourseDescription(@Param() params: CourseDeleteParamDto) {
    const data = await this.courseService.getCourseDescription(params.id);
    return Result.success('查询成功', data);
  }
}
