import { Module } from '@nestjs/common';
import { CourseController } from '@/modules/course/course.controller';
import { CourseService } from '@/modules/course/course.service';
import { CourseMaterialController } from '@/modules/course/course-material.controller';
import { CourseMaterialService } from '@/modules/course/course-material.service';
import { UserModule } from '@/modules/user/user.module';
import { FileModule } from '@/modules/file/file.module';
import { InvitationModule } from '@/modules/invitation/invitation.module';

@Module({
  imports: [UserModule, FileModule, InvitationModule],
  controllers: [CourseController, CourseMaterialController],
  providers: [CourseService, CourseMaterialService],
  exports: [CourseService, CourseMaterialService],
})
export class CourseModule { }
