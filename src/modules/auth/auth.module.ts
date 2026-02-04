import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {JwtModule} from "@nestjs/jwt";
import {JwtConfigService} from "@/config/jwtConfig.service";

@Module({
    imports: [JwtModule.registerAsync({
        useClass: JwtConfigService
    })],
    providers: [AuthService, JwtConfigService],
    controllers: [AuthController],
    exports: [JwtModule]
})
export class AuthModule {}
