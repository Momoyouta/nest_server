import { Module } from '@nestjs/common';
import { CourseController } from '@/modules/course/course.controller';
import { CourseService } from '@/modules/course/course.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
