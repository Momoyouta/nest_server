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
import { UserService } from './user.service';
import { Result } from '@/database/types/result.type';
import {
  ApiExtraModels,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';
import { CurrentUserProfile } from './dto/CurrentUserProfile.dto';
import { UpdateUserRolesDto } from './dto/UpdateUserRolesDto.dto';
import {
  UpdateAvatarDto,
  UpdateAvatarResponseDto,
  UpdateBasicProfileDto,
  UpdateBasicProfileResponseDto,
  UpdatePasswordDto,
  UpdatePasswordResponseDto,
  UpdatePhoneDto,
  UpdatePhoneResponseDto,
} from './dto/UpdateSelfProfile.dto';
import { Role } from '@/database/entities/role.entity';
import { User } from '@/database/entities/user.entity';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { AllJwtAuth } from '@/common/decorators/auth.decorator';

@ApiTags('用户管理')
@ApiBearerAuth()
@ApiExtraModels(
  CurrentUserProfile,
  UpdateBasicProfileResponseDto,
  UpdatePasswordResponseDto,
  UpdateAvatarResponseDto,
  UpdatePhoneResponseDto,
)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

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
  async update(@Param('id') id: string, @Body() body: Partial<User>) {
    const userId = this.alsService.getUserId();
    if (!userId) throw new ForbiddenException('未登录');

    // 权限校验：本人或管理员
    const userRoles = await this.userService.getUserRole(userId);
    const roleIds = userRoles.map((r) => r.id.toString());
    const adminRoleIds = new Set([AdminRolesMap.root, AdminRolesMap.admin]);
    const isAdmin = roleIds.some((roleId) => adminRoleIds.has(roleId));

    if (!isAdmin && id !== userId) {
      throw new ForbiddenException('没有权限修改他人的信息');
    }

    const res = await this.userService.updateUser(id, body);
    return Result.success('更新成功', res);
  }

  @Put('profile/updateBasic')
  @ApiOperation({ summary: '用户端修改基础资料（仅允许受控字段）' })
  @ApiResponse({
    status: 200,
    description: '修改成功',
    type: UpdateBasicProfileResponseDto,
  })
  @ApiBody({ type: UpdateBasicProfileDto })
  @ApiResponse({ status: 400, description: '参数错误' })
  async updateBasicProfile(
    @Body() dto: UpdateBasicProfileDto,
  ): Promise<Result<UpdateBasicProfileResponseDto>> {
    const userId = this.getCurrentUserIdOrThrow();
    const data = await this.userService.updateSelfBasic(userId, {
      sex: dto.sex,
    });
    return Result.success('修改成功', data);
  }

  @Put('profile/updatePassword')
  @ApiOperation({ summary: '用户端修改密码（需校验旧密码）' })
  @ApiResponse({
    status: 200,
    description: '修改成功',
    type: UpdatePasswordResponseDto,
  })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 400, description: '旧密码错误或参数错误' })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
  ): Promise<Result<UpdatePasswordResponseDto>> {
    const userId = this.getCurrentUserIdOrThrow();
    const data = await this.userService.updateSelfPassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
    return Result.success('修改成功', data);
  }

  @Put('profile/updateAvatar')
  @ApiOperation({
    summary:
      '用户端修改头像（将 uploadImageTemp 临时图移动到 fileStore/users/avatars/{user_id}-{timestamp}.png）',
  })
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({
    status: 200,
    description: '修改成功',
    type: UpdateAvatarResponseDto,
  })
  @ApiResponse({ status: 400, description: '临时路径非法或文件移动失败' })
  async updateAvatar(
    @Body() dto: UpdateAvatarDto,
  ): Promise<Result<UpdateAvatarResponseDto>> {
    const userId = this.getCurrentUserIdOrThrow();
    const data = await this.userService.updateSelfAvatar(
      userId,
      dto.tempAvatarPath,
    );
    return Result.success('修改成功', data);
  }

  @Put('profile/updateAvatarAdmin')
  @AdminAuth()
  @ApiOperation({
    summary: '管理端修改头像',
  })
  @ApiBody({ type: UpdateAvatarDto })
  @ApiResponse({
    status: 200,
    description: '修改成功',
    type: UpdateAvatarResponseDto,
  })
  @ApiResponse({ status: 400, description: '临时路径非法或文件移动失败' })
  async updateAvatarAdmin(
    @Body() dto: UpdateAvatarDto,
    @Param('userId') userId: string,
  ): Promise<Result<UpdateAvatarResponseDto>> {
    const data = await this.userService.updateSelfAvatar(
      userId,
      dto.tempAvatarPath,
    );
    return Result.success('修改成功', data);
  }

  @Put('profile/updatePhone')
  @ApiOperation({
    summary:
      '用户端修改手机号（code 为空时发送验证码并写入 Redis；携带 code 时完成校验与更新）',
  })
  @ApiBody({ type: UpdatePhoneDto })
  @ApiResponse({
    status: 200,
    description: '操作成功',
    type: UpdatePhoneResponseDto,
  })
  @ApiResponse({ status: 400, description: '验证码错误/过期或参数错误' })
  async updatePhone(
    @Body() dto: UpdatePhoneDto,
  ): Promise<Result<UpdatePhoneResponseDto>> {
    const userId = this.getCurrentUserIdOrThrow();
    const data = await this.userService.updateSelfPhone(
      userId,
      dto.newPhone,
      dto.code,
    );
    return Result.success('操作成功', data);
  }

  @Get('profile/:id')
  @ApiOperation({ summary: '用户端获取个人信息（仅本人）' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiOkResponse({
    description: '成功返回用户个人信息',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '查询成功' },
        data: { $ref: getSchemaPath(CurrentUserProfile) },
      },
    },
  })
  public async getSelfProfile(
    @Param('id') id: string,
  ): Promise<Result<CurrentUserProfile>> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    if (id !== userId) {
      throw new ForbiddenException('只能查询当前用户信息');
    }

    const schoolId = this.alsService.getSchoolId();
    return Result.success(
      '查询成功',
      await this.userService.getSelfProfileInfo(id, schoolId),
    );
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

  private getCurrentUserIdOrThrow(): string {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    return userId;
  }
}
