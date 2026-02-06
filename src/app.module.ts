import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from '@/modules/common/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@/common/guard/auth.guard';
import { RequestContextMiddlewareMiddleware } from '@/common/middleware/request-context-middleware/request-context-middleware.middleware';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev'],
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'next_app',
      autoLoadEntities: true,
      logging: true,
    }),
    UserModule,
    CommonModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AsyncLocalstorageService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddlewareMiddleware).forRoutes('*');
  }
}
