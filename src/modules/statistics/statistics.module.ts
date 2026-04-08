import { Module } from '@nestjs/common';
import { UserModule } from '@/modules/user/user.module';
import { StatisticsService } from '@/modules/statistics/statistics.service';
import { PlatformStatisticsController } from '@/modules/statistics/platform-statistics.controller';
import { SchoolStatisticsController } from '@/modules/statistics/school-statistics.controller';
import { TeacherStatisticsController } from '@/modules/statistics/teacher-statistics.controller';
import { StudentStatisticsController } from '@/modules/statistics/student-statistics.controller';
import { StatisticsDictionaryController } from '@/modules/statistics/statistics-dictionary.controller';

@Module({
  imports: [UserModule],
  controllers: [
    PlatformStatisticsController,
    SchoolStatisticsController,
    TeacherStatisticsController,
    StudentStatisticsController,
    StatisticsDictionaryController,
  ],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
