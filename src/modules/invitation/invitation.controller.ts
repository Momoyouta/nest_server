import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { InvitationService } from './invitation.service';
import { CreateInviteDto, InvitationQueryDto } from '@/common/dto/invite.dto';
import { Result } from '@/database/types/result.type';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';

@ApiTags('邀请码管理')
@AdminAuth()
@Controller('admin/invite')
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly alsService: AsyncLocalstorageService,
  ) { }

  @Post()
  @ApiOperation({ summary: '创建邀请码' })
  async createInvite(@Body() dto: CreateInviteDto) {
    const creatorId = this.alsService.getUserId() || 'admin';
    const code = await this.invitationService.createInvite(dto, creatorId);
    return Result.success('邀请码创建成功', { code });
  }

  @Get()
  @ApiOperation({ summary: '分页查询邀请码' })
  async findAll(@Query() query: InvitationQueryDto) {
    const data = await this.invitationService.findAll(query);
    return Result.success('查询成功', data);
  }

  @Delete(':code')
  @ApiOperation({ summary: '删除邀请码' })
  async deleteInvite(@Param('code') code: string) {
    await this.invitationService.deleteInvite(code);
    return Result.success('删除成功', null);
  }
}
