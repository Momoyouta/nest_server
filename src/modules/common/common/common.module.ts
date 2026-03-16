import { Global, Module } from '@nestjs/common';
import { CommonController } from '@/modules/common/common/common.controller';
import { CommonService } from '@/modules/common/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
const entities = [User, Role];
@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  controllers: [CommonController],
  providers: [CommonService, AsyncLocalstorageService],
  exports: [TypeOrmModule.forFeature(entities), AsyncLocalstorageService],
})
export class CommonModule {}
