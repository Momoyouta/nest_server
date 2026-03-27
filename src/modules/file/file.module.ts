import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileController } from './file.controller';
import { UploadService } from './upload/upload.service';
import { ChunkService } from './chunk/chunk.service';
import { StorageService } from './storage/storage.service';
import { CleanupTask } from './tasks/cleanup.task';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ScheduleModule.forRoot(), UserModule],
  controllers: [FileController],
  providers: [UploadService, ChunkService, StorageService, CleanupTask],
  exports: [UploadService, ChunkService, StorageService],
})
export class FileModule {}
