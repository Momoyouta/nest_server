import { Module } from '@nestjs/common';
import { CourseController } from '@/modules/course/course.controller';
import { CourseService } from '@/modules/course/course.service';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [UserModule, FileModule],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
