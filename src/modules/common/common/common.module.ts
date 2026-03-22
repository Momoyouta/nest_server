import { Global, Module } from '@nestjs/common';
import { CommonController } from '@/modules/common/common/common.controller';
import { CommonService } from '@/modules/common/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { Student } from '@/database/entities/student.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { School } from '@/database/entities/school.entity';

const entities = [User, Role, Student, Teacher, SchoolAdmin, School];
@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  controllers: [CommonController],
  providers: [CommonService, AsyncLocalstorageService],
  exports: [TypeOrmModule.forFeature(entities), AsyncLocalstorageService],
})
export class CommonModule {}
