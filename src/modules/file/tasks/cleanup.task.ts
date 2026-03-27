import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChunkService } from '../chunk/chunk.service';

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(private readonly chunkService: ChunkService) {}

  /**
   * 定时清理过期孤立分片
   * 默认每天凌晨 2:00 执行
   * 可通过环境变量 CHUNK_CLEANUP_CRON 覆盖
   */
  @Cron(process.env.CHUNK_CLEANUP_CRON || '0 2 * * *')
  async handleCleanupCron() {
    const start = Date.now();
    this.logger.log('开始执行分片清理任务...');
    try {
      const { cleanedCount } = await this.cleanExpiredChunks();
      const duration = Date.now() - start;
      if (cleanedCount === 0) {
        this.logger.log('无过期分片需清理');
      } else {
        this.logger.log(`清理 ${cleanedCount} 条过期分片，耗时 ${duration}ms`);
      }
    } catch (error) {
      this.logger.error('分片清理任务异常', error);
    }
  }

  /**
   * 执行清理逻辑（可复用于手动触发）
   * @returns { cleanedCount, durationMs }
   */
  async cleanExpiredChunks(): Promise<{ cleanedCount: number; durationMs: number }> {
    const start = Date.now();
    const expireHours = parseInt(process.env.CHUNK_EXPIRE_HOURS || '24', 10);
    const cleanedCount = await this.chunkService.cleanExpiredChunks(expireHours);
    const durationMs = Date.now() - start;
    return { cleanedCount, durationMs };
  }
}
