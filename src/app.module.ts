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
import { SchoolModule } from './modules/school/school.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { SchoolAdminModule } from './modules/school_admin/school_admin.module';
import { FileAdminModule } from './modules/file_admin/file_admin.module';
import { RedisModule } from './modules/redis/redis.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { FileModule } from './modules/file/file.module';
import { CourseModule } from './modules/course/course.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { getFileStoreRoot } from '@/common/utils/file-path.map';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { StatisticsModule } from '@/modules/statistics/statistics.module';

const isDevEnv = (process.env.NODE_ENV || 'dev') === 'dev';

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
        logging: ['error'],
      }),
    }),
    UserModule,
    CommonModule,
    AuthModule,
    SchoolModule,
    StudentModule,
    TeacherModule,
    SchoolAdminModule,
    FileAdminModule,
    RedisModule,
    InvitationModule,
    FileModule,
    CourseModule,
    AssignmentModule,
    StatisticsModule,
    ...(isDevEnv
      ? [
          ServeStaticModule.forRoot({
            rootPath: getFileStoreRoot(),
            serveRoot: '/fileStore',
            serveStaticOptions: {
              index: false,
            },
          }),
        ]
      : []),
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
