import {
  Controller,
  Get,
  Param,
  Query,
  Put,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Result } from '@/database/types/result.type';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UpdateUserRolesDto } from './dto/UpdateUserRolesDto.dto';
import { Role } from '@/database/entities/role.entity';
import { User } from '@/database/entities/user.entity';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('hello')
  @ApiOperation({ summary: '测试接口' })
  public hello(): Result<string> {
    return Result.success('success', this.userService.getHello());
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
