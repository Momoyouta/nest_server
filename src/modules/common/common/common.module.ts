import {Global, Module} from '@nestjs/common';
import {CommonController} from "@/modules/common/common/common.controller";
import {CommonService} from "@/modules/common/common/common.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@/database/entities/user.entity";
import {Role} from "@/database/entities/role.entity";
const entities = [User, Role]
@Global()
@Module({
    imports: [TypeOrmModule.forFeature(entities)],
    controllers: [CommonController],
    providers: [CommonService],
    exports: [TypeOrmModule.forFeature(entities)],
})
export class CommonModule {}
