import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { StudentService } from '@/modules/student/student.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Result } from '../../database/types/result.type';
import { Role } from '../../common/decorators/role.decorator';
import { AdminRoles, AdminRolesMap } from '../../common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { UserService } from '../user/user.service';
import * as _ from 'lodash';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { AllJwtAuth } from '@/common/decorators/auth.decorator';
import {
  JoinCourseByInviteCodeDto,
  JoinCourseByInviteCodeResponseDto,
} from '@/modules/student/dto/join-course-by-invite.dto';

@ApiTags('学生管理')
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly alsService: AsyncLocalstorageService,
    private readonly userService: UserService,
  ) { }

  @Get()
  @AdminAuth()
  @ApiOperation({ summary: '获取学生列表' })
  async findAll(@Query() query: BaseQueryDto) {
    const data = await this.studentService.findAll(query);
    return Result.success('查询成功', data);
  }

  @Get(':id')
  @AdminAuth()
  @ApiOperation({ summary: '获取学生详情' })
  async findOne(@Param('id') id: string) {
    const student = await this.studentService.findOne(id);
    return Result.success('查询成功', student);
  }

  @Put(':id')
  @AdminAuth()
  @ApiOperation({ summary: '修改学生信息' })
  async update(@Param('id') id: string, @Body() body: any) {
    const { userId } = this.alsService.getStore() || {};
    if (!userId) throw new ForbiddenException('未登录');
    const student = await this.studentService.findOne(id);

    // 权限校验：本人或管理员
    const userRoles = await this.userService.getUserRole(userId);
    const roleIds = userRoles.map((r) => r.id.toString());
    const isAdmin = _.intersection(roleIds, AdminRoles).length > 0;

    if (!isAdmin && student.user_id !== userId) {
      throw new ForbiddenException('没有权限修改他人的信息');
    }

    const res = await this.studentService.update(id, body);
    return Result.success('更新成功', res);
  }

  @Delete(':id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '软删除学生' })
  async remove(@Param('id') id: string) {
    await this.studentService.softDelete(id);
    return Result.success('禁用成功', null);
  }

  @Post('joinCourseByInviteCode')
  @Role(AdminRolesMap.student)
  @ApiOperation({ summary: '学生通过邀请码加入课程' })
  @ApiBody({ type: JoinCourseByInviteCodeDto })
  @ApiResponse({
    status: 200,
    description: '加入成功',
    type: JoinCourseByInviteCodeResponseDto,
  })
  async joinCourseByInviteCode(@Body() payload: JoinCourseByInviteCodeDto) {
    const data = await this.studentService.joinCourseByInviteCode(payload);
    return Result.success('加入成功', data);
  }

  @Post('leaveCourse')
  @Role(AdminRolesMap.student)
  @ApiOperation({ summary: '学生退出课程' })
  @ApiResponse({
    status: 200,
    description: '退出成功',
  })
  async leaveCourse(@Body() body: { courseId: string }) {
    const { courseId } = body;
    if (!courseId) {
      throw new BadRequestException('courseId 不能为空');
    }
    await this.studentService.leaveCourse(courseId);
    return Result.success('退出成功', null);
  }
}
