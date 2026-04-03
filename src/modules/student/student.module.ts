import { Module } from '@nestjs/common';
import { StudentController } from '@/modules/student/student.controller';
import { StudentService } from '@/modules/student/student.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { InvitationModule } from '@/modules/invitation/invitation.module';

@Module({
  imports: [UserModule, InvitationModule],
  controllers: [StudentController],
  providers: [StudentService, UserService],
  exports: [StudentService],
})
export class StudentModule {}
