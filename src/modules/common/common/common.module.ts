import { Global, Module } from '@nestjs/common';
import { CommonController } from '@/modules/common/common/common.controller';
import { CommonService } from '@/modules/common/common/common.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { Student } from '@/database/entities/student.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { School } from '@/database/entities/school.entity';
import { InvitationCode } from '@/database/entities/invitation_code.entity';
import { FileChunk } from '@/modules/file/chunk/chunk.entity';
import { SchoolApplication } from '@/database/entities/school_application.entity';
import { Course } from '@/database/entities/course.entity';
import { CourseChapter } from '@/database/entities/course_chapter.entity';
import { CourseLesson } from '@/database/entities/course_lesson.entity';
import { CourseTeacher } from '@/database/entities/course_teacher.entity';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { CourseTeachingGroup } from '@/database/entities/course_teaching_group.entity';
import { CourseGroupTeacher } from '@/database/entities/course_group_teacher.entity';
import { CourseLearningRecord } from '@/database/entities/course_learning_record.entity';
import { CourseAssignment } from '@/database/entities/course_assignment.entity';
import { CourseAssignmentQuestion } from '@/database/entities/course_assignment_question.entity';
import { AssignmentSubmission } from '@/database/entities/assignment_submission.entity';
import { AssignmentAnswerDetail } from '@/database/entities/assignment_answer_detail.entity';
import { CourseMaterial } from '@/database/entities/course_material.entity';
import { CourseQuestionResource } from '@/database/entities/course_question_resource.entity';

const entities = [
  User,
  Role,
  Student,
  Teacher,
  SchoolAdmin,
  School,
  InvitationCode,
  FileChunk,
  SchoolApplication,
  Course,
  CourseChapter,
  CourseLesson,
  CourseTeacher,
  CourseStudent,
  CourseTeachingGroup,
  CourseGroupTeacher,
  CourseLearningRecord,
  CourseAssignment,
  CourseAssignmentQuestion,
  AssignmentSubmission,
  AssignmentAnswerDetail,
  CourseMaterial,
  CourseQuestionResource,
];
@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  controllers: [CommonController],
  providers: [CommonService, AsyncLocalstorageService],
  exports: [TypeOrmModule.forFeature(entities), AsyncLocalstorageService],
})
export class CommonModule {}
