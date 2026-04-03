import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InvitationService } from '@/modules/invitation/invitation.service';

@Injectable()
export class InvitationCleanupTask {
  private readonly logger = new Logger(InvitationCleanupTask.name);

  constructor(private readonly invitationService: InvitationService) {}

  @Cron(process.env.INVITE_CLEANUP_CRON || '0 3 * * *')
  async handleCleanupCron() {
    const start = Date.now();
    this.logger.log('开始执行邀请码清理任务...');
    try {
      const result = await this.invitationService.cleanExpiredInvitations();
      const duration = Date.now() - start;
      this.logger.log(
        `邀请码清理完成，过期删除 ${result.expiredDeletedCount} 条，孤儿缓存删除 ${result.orphanCacheDeletedCount} 条，耗时 ${duration}ms`,
      );
    } catch (error) {
      this.logger.error('邀请码清理任务异常', error);
    }
  }
}
