import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { InvitationService } from './invitation.service';
import {
  CreateCourseInviteDto,
  CreateCourseInviteResponseDto,
  CreateInviteDto,
  InvitationQueryDto,
} from '@/common/dto/invite.dto';
import { Result } from '@/database/types/result.type';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRoles } from '@/common/utils/role.map';

@ApiTags('邀请码管理')
@ApiBearerAuth('access_token')
@Controller('admin/invite')
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

  @Post()
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '创建邀请码' })
  async createInvite(@Body() dto: CreateInviteDto) {
    const creatorId = this.alsService.getUserId() || 'admin';
    const code = await this.invitationService.createInvite(dto, creatorId);
    return Result.success('邀请码创建成功', { code });
  }

  @Post('createCourseInviteAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员创建课程教学组邀请码' })
  @ApiBody({ type: CreateCourseInviteDto })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateCourseInviteResponseDto,
  })
  async createCourseInviteAdmin(@Body() dto: CreateCourseInviteDto) {
    const data =
      await this.invitationService.createCourseInviteByCurrentUser(dto);
    return Result.success('邀请码创建成功', data);
  }

  @Get()
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '分页查询邀请码' })
  async findAll(@Query() query: InvitationQueryDto) {
    const data = await this.invitationService.findAll(query);
    return Result.success('查询成功', data);
  }

  @Delete(':code')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '删除邀请码' })
  async deleteInvite(@Param('code') code: string) {
    await this.invitationService.deleteInvite(code);
    return Result.success('删除成功', null);
  }
}
