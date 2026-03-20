import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from '@/modules/common/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@/common/guard/auth.guard';
import { RequestContextMiddlewareMiddleware } from '@/common/middleware/request-context-middleware/request-context-middleware.middleware';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { RoleGuard } from './common/guard/role.guard';
import { SchoolModule } from './modules/school/school.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('dbHost') ?? 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'study_platform',
        autoLoadEntities: true,
        logging: true,
      }),
    }),
    UserModule,
    CommonModule,
    AuthModule,
    SchoolModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddlewareMiddleware).forRoutes('*');
  }
}
