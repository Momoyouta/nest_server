import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllJwtAuth } from '@/common/decorators/auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRolesMap } from '@/common/utils/role.map';
import {
  CreateCourseInviteDto,
  CreateCourseInviteResponseDto,
} from '@/common/dto/invite.dto';
import { InvitationService } from '@/modules/invitation/invitation.service';
import { Result } from '@/database/types/result.type';

@ApiTags('邀请码管理')
@ApiBearerAuth('access_token')
@Controller('invitation')
export class InvitationUserController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('createCourseInvite')
  @AllJwtAuth()
  @Role(AdminRolesMap.teacher)
  @ApiOperation({ summary: '教师创建课程教学组邀请码' })
  @ApiBody({ type: CreateCourseInviteDto })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateCourseInviteResponseDto,
  })
  async createCourseInvite(@Body() dto: CreateCourseInviteDto) {
    const data =
      await this.invitationService.createCourseInviteByCurrentUser(dto);
    return Result.success('邀请码创建成功', data);
  }
}
