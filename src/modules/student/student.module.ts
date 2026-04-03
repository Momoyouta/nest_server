import { Module } from '@nestjs/common';
import { StudentController } from '@/modules/student/student.controller';
import { StudentService } from '@/modules/student/student.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { InvitationModule } from '@/modules/invitation/invitation.module';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [UserModule, InvitationModule, CourseModule],
  controllers: [StudentController],
  providers: [StudentService, UserService],
  exports: [StudentService],
})
export class StudentModule {}
