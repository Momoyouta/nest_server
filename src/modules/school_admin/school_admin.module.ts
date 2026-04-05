import { Module } from '@nestjs/common';
import { SchoolAdminController } from '@/modules/school_admin/school_admin.controller';
import { SchoolAdminService } from '@/modules/school_admin/school_admin.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService],
})
export class SchoolAdminModule {}
