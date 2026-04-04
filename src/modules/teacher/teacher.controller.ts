import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Result } from '../../database/types/result.type';
import { Role } from '../../common/decorators/role.decorator';
import { AdminRoles, AdminRolesMap } from '../../common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { UserService } from '../user/user.service';
import * as _ from 'lodash';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import {
  ListMyCreatedCoursesQueryDto,
  CourseUserListResponseDto,
  CreateCourseTeacherDto,
  CreateCourseResponseDto,
  ListTeachingGroupAdminQueryDto,
  ListTeachingGroupAdminResponseDto,
  GetTeachingGroupAdminResponseDto,
  CreateTeachingGroupAdminDto,
  CreateTeachingGroupAdminResponseDto,
  UpdateTeachingGroupAdminDto,
  UpdateTeachingGroupAdminResponseDto,
  DeleteTeachingGroupAdminResponseDto,
  QuerySchoolTeacherByNameAdminDto,
  QuerySchoolTeacherByNameAdminResponseDto,
  BindTeachingGroupTeachersAdminDto,
  BindTeachingGroupTeachersAdminResponseDto,
} from '../course/dto/CourseAdmin.dto';

@ApiTags('教师管理')
@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly alsService: AsyncLocalstorageService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @AdminAuth()
  @ApiOperation({ summary: '获取教师列表' })
  async findAll(@Query() query: BaseQueryDto) {
    const data = await this.teacherService.findAll(query);
    return Result.success('查询成功', data);
  }

  @Get('leaveCourse')
  @ApiOperation({ summary: '教师退出课程' })
  async leaveCourse(@Query('courseId') courseId: string) {
    if (!courseId) {
      throw new BadRequestException('courseId 不能为空');
    }
    await this.teacherService.leaveCourse(courseId);
    return Result.success('退出成功', null);
  }

  @Get('myGroups')
  @ApiOperation({ summary: '获取当前教师某个课程所属教学组' })
  async getMyGroups(@Query('course_id') courseId: string) {
    if (!courseId) {
      throw new BadRequestException('course_id 不能为空');
    }
    const data = await this.teacherService.getMyGroups(courseId);
    return Result.success('查询成功', data);
  }

  @Get('myCreatedCourses')
  @ApiOperation({ summary: '查询当前教师创建的课程' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CourseUserListResponseDto,
  })
  async myCreatedCourses(@Query() query: ListMyCreatedCoursesQueryDto) {
    const data = await this.teacherService.listMyCreatedCourses(query);
    return Result.success('查询成功', data);
  }

  @Post('createCourse')
  @ApiOperation({ summary: '教师快捷创建课程' })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateCourseResponseDto,
  })
  async createCourse(@Body() payload: CreateCourseTeacherDto) {
    const data = await this.teacherService.createCourse(payload);
    return Result.success('创建成功', data);
  }

  @Get('listTeachingGroup')
  @ApiOperation({ summary: '教师查询其课程下的教学组列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: ListTeachingGroupAdminResponseDto,
  })
  async listTeachingGroup(@Query() query: ListTeachingGroupAdminQueryDto) {
    const data = await this.teacherService.listTeachingGroup(query);
    return Result.success('查询成功', data);
  }

  @Get('getTeachingGroup/:id')
  @ApiOperation({ summary: '教师查询其课程下的教学组详情' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: GetTeachingGroupAdminResponseDto,
  })
  async getTeachingGroup(@Param('id') id: string) {
    const data = await this.teacherService.getTeachingGroup(id);
    return Result.success('查询成功', data);
  }

  @Put('bindTeachingGroupTeachers')
  @ApiOperation({ summary: '绑定教学组任课老师（教师用户端）' })
  @ApiBody({ type: BindTeachingGroupTeachersAdminDto })
  @ApiResponse({
    status: 200,
    description: '绑定成功',
    type: BindTeachingGroupTeachersAdminResponseDto,
  })
  async bindTeachingGroupTeachers(
    @Body() payload: BindTeachingGroupTeachersAdminDto,
  ) {
    const data = await this.teacherService.bindTeachingGroupTeachers(payload);
    return Result.success('绑定成功', data);
  }

  @Get('querySchoolTeacherByName')
  @ApiOperation({ summary: '按本校与姓名前缀查询老师' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: QuerySchoolTeacherByNameAdminResponseDto,
  })
  async querySchoolTeacherByName(
    @Query() query: QuerySchoolTeacherByNameAdminDto,
  ) {
    const data = await this.teacherService.querySchoolTeacherByName(query);
    return Result.success('查询成功', data);
  }

  @Post('createTeachingGroup')
  @ApiOperation({ summary: '教师创建教学组' })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateTeachingGroupAdminResponseDto,
  })
  async createTeachingGroup(@Body() payload: CreateTeachingGroupAdminDto) {
    const data = await this.teacherService.createTeachingGroup(payload);
    return Result.success('创建成功', data);
  }

  @Put('updateTeachingGroup')
  @ApiOperation({ summary: '教师更新教学组' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateTeachingGroupAdminResponseDto,
  })
  async updateTeachingGroup(@Body() payload: UpdateTeachingGroupAdminDto) {
    const data = await this.teacherService.updateTeachingGroup(payload);
    return Result.success('更新成功', data);
  }

  @Delete('deleteTeachingGroup/:id')
  @ApiOperation({ summary: '教师删除教学组' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteTeachingGroupAdminResponseDto,
  })
  async deleteTeachingGroup(@Param('id') id: string) {
    const data = await this.teacherService.deleteTeachingGroup(id);
    return Result.success('删除成功', data);
  }

  @Get(':id')
  @AdminAuth()
  @ApiOperation({ summary: '获取教师详情' })
  async findOne(@Param('id') id: string) {
    const teacher = await this.teacherService.findOne(id);
    return Result.success('查询成功', teacher);
  }

  @Put(':id')
  @AdminAuth()
  @ApiOperation({ summary: '修改教师信息' })
  async update(@Param('id') id: string, @Body() body: any) {
    const { userId } = this.alsService.getStore() || {};
    if (!userId) throw new ForbiddenException('未登录');
    const teacher = await this.teacherService.findOne(id);

    // 权限校验：本人或管理员
    const userRoles = await this.userService.getUserRole(userId);
    const roleIds = userRoles.map((r) => r.id.toString());
    const isAdmin = _.intersection(roleIds, AdminRoles).length > 0;

    if (!isAdmin && teacher.user_id !== userId) {
      throw new ForbiddenException('没有权限修改他人的信息');
    }

    const res = await this.teacherService.update(id, body);
    return Result.success('更新成功', res);
  }

  @Delete(':id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '软删除教师' })
  async remove(@Param('id') id: string) {
    await this.teacherService.softDelete(id);
    return Result.success('禁用成功', null);
  }
}
