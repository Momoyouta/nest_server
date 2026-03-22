import {
  Controller,
  Get,
  Param,
  Query,
  Put,
  Body,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { AdminRolesMap } from '@/common/utils/role.map';
import * as _ from 'lodash';
import { UserService } from './user.service';
import { Result } from '@/database/types/result.type';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UpdateUserRolesDto } from './dto/UpdateUserRolesDto.dto';
import { Role } from '@/database/entities/role.entity';
import { User } from '@/database/entities/user.entity';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { console } from 'inspector';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly alsService: AsyncLocalstorageService,
  ) { }

  @Get('hello')
  @ApiOperation({ summary: '测试接口' })
  public hello(): Result<string> {
    return Result.success('success', this.userService.getHello());
  }

  @Get()
  @AdminAuth()
  @ApiOperation({ summary: '分页获取用户列表' })
  @ApiResponse({ status: 200, description: '成功返回用户列表' })
  async findAll(@Query() query: BaseQueryDto) {
    const { list, total } = await this.userService.findAll(query);
    return Result.success('查询成功', { list, total });
  }

  @Put(':id')
  @AdminAuth()
  @ApiOperation({ summary: '修改用户信息' })
  async update(@Param('id') id: string, @Body() body: any) {
    const { userId } = this.alsService.getStore() || {};
    if (!userId) throw new ForbiddenException('未登录');

    // 权限校验：本人或管理员
    const userRoles = await this.userService.getUserRole(userId);
    const roleIds = userRoles.map(r => r.id.toString());
    const isAdmin = _.intersection(roleIds, [AdminRolesMap.root, AdminRolesMap.admin]).length > 0;

    if (!isAdmin && id !== userId) {
      throw new ForbiddenException('没有权限修改他人的信息');
    }

    const res = await this.userService.updateUser(id, body);
    return Result.success('更新成功', res);
  }

  @Get('findByIdOne/:id')
  @ApiOperation({ summary: '通过 ID 查询用户' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  public async getUser(@Param('id') id: string): Promise<Result<User>> {
    const result = await this.userService.getUser(id);
    if (!result || !result.user) {
      throw new NotFoundException('用户不存在');
    }
    return Result.success('查询成功', result.user);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: '获取用户的角色详细列表' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '成功返回角色数组', type: [Role] })
  public async getUserRoles(@Param('id') id: string): Promise<Result<Role[]>> {
    const roles = await this.userService.getUserRolesDetails(id);
    return Result.success('获取成功', roles);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: '更新用户的角色关联' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  public async updateUserRoles(
    @Param('id') id: string,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ): Promise<Result<{ code: number; message: string }>> {
    const result = await this.userService.updateUserRoles(
      id,
      updateUserRolesDto.roleIds,
    );
    return Result.success('更新成功', result);
  }

  @Get('getUserRole')
  @ApiOperation({ summary: '兼容旧接口：通过 Query 获取角色' })
  public async getUserRole(@Query('id') id: string): Promise<Result<Role[]>> {
    if (!id) {
      throw new BadRequestException('用户 ID 不能为空');
    }
    const userRoles = await this.userService.getUserRole(id);
    return Result.success('获取成功', userRoles);
  }
}
