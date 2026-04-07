import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AssignmentService } from './assignment.service';
import { TeacherAssignmentController } from './teacher/teacher-assignment.controller';
import { StudentAssignmentController } from './student/student-assignment.controller';

@Module({
  imports: [UserModule],
  controllers: [TeacherAssignmentController, StudentAssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
