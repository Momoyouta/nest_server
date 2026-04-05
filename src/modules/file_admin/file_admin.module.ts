import { Module } from '@nestjs/common';
import { UserModule } from '@/modules/user/user.module';
import { FileChunkAdminController } from '@/modules/file_admin/file_chunk_admin.controller';
import { FileChunkAdminService } from '@/modules/file_admin/file_chunk_admin.service';

@Module({
  imports: [UserModule],
  controllers: [FileChunkAdminController],
  providers: [FileChunkAdminService],
})
export class FileAdminModule {}
