import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from '@/config/jwtConfig.service';
import { UserModule } from '../user/user.module';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    UserModule,
    InvitationModule,
  ],
  providers: [AuthService, JwtConfigService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
