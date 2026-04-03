import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { InvitationUserController } from './invitation.user.controller';
import { InvitationCleanupTask } from './tasks/invitation-cleanup.task';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [InvitationController, InvitationUserController],
  providers: [InvitationService, InvitationCleanupTask],
  exports: [InvitationService],
  imports: [UserModule],
})
export class InvitationModule {}
