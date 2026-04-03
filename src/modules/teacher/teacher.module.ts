import { Module } from '@nestjs/common';
import { TeacherController } from '@/modules/teacher/teacher.controller';
import { TeacherService } from '@/modules/teacher/teacher.service';
import { UserModule } from '../user/user.module';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [UserModule, CourseModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
