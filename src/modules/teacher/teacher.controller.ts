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
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Result } from '../../database/types/result.type';
import { Role } from '../../common/decorators/role.decorator';
import { AdminRoles, AdminRolesMap } from '../../common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { UserService } from '../user/user.service';
import * as _ from 'lodash';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';

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
