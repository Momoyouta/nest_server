import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignmentAnswerDetail } from '@/database/entities/assignment_answer_detail.entity';
import { AssignmentSubmission } from '@/database/entities/assignment_submission.entity';
import { Course } from '@/database/entities/course.entity';
import { CourseAssignmentQuestion } from '@/database/entities/course_assignment_question.entity';
import { CourseAssignment } from '@/database/entities/course_assignment.entity';
import { CourseChapter } from '@/database/entities/course_chapter.entity';
import { CourseLearningRecord } from '@/database/entities/course_learning_record.entity';
import { CourseLesson } from '@/database/entities/course_lesson.entity';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { CourseTeacher } from '@/database/entities/course_teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { School } from '@/database/entities/school.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { User } from '@/database/entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import {
  CourseBasicResponseDto,
  CourseListItemDto,
  CourseListQueryDto,
  CreateCourseDto,
  UpdateCourseDto,
} from '@/modules/course/dto/CourseAdmin.dto';
import { CourseStatusMap } from '@/common/utils/course.map';
import { PlatformAdminRoles, SchoolAdminRoles } from '@/common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { StorageService } from '../file/storage/storage.service';
import { FilePathTemplate } from '@/common/utils/file-path.map';
import { UpdateCourseCoverDto } from '@/modules/course/dto/CourseAdmin.dto';

interface CourseListRowRaw {
  id: string;
  school_id: string;
  school_name: string | null;
  creator_id: string;
  name: string;
  cover_img: string | null;
  status: number | string;
  create_time: string | null;
  update_time: string | null;
}

interface TeacherNameRowRaw {
  course_id: string;
  teacher_name: string | null;
}

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseChapter)
    private readonly courseChapterRepository: Repository<CourseChapter>,
    @InjectRepository(CourseLesson)
    private readonly courseLessonRepository: Repository<CourseLesson>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepository: Repository<CourseTeacher>,
    @InjectRepository(CourseStudent)
    private readonly courseStudentRepository: Repository<CourseStudent>,
    @InjectRepository(CourseLearningRecord)
    private readonly courseLearningRecordRepository: Repository<CourseLearningRecord>,
    @InjectRepository(CourseAssignment)
    private readonly courseAssignmentRepository: Repository<CourseAssignment>,
    @InjectRepository(CourseAssignmentQuestion)
    private readonly courseAssignmentQuestionRepository: Repository<CourseAssignmentQuestion>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(AssignmentAnswerDetail)
    private readonly assignmentAnswerDetailRepository: Repository<AssignmentAnswerDetail>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly dataSource: DataSource,
    private readonly alsService: AsyncLocalstorageService,
    private readonly storageService: StorageService,
  ) {}

  async createCourseAdmin(payload: CreateCourseDto): Promise<{ id: string }> {
    const user = await this.getCurrentUserOrThrow();
    const schoolId = await this.resolveSchoolIdByRole(
      user,
      payload.school_id,
      true,
    );

    const course = this.courseRepository.create({
      school_id: schoolId,
      creator_id: user.id,
      name: payload.name,
      cover_img: payload.cover_img,
      description: payload.description,
      status: Number(CourseStatusMap.UNPUBLISHED),
    });

    const saved = await this.courseRepository.save(course);

    // 创建存储目录
    this.storageService.createCourseDir({
      schoolId: saved.school_id,
      courseId: saved.id,
    });

    return { id: saved.id };
  }

  async updateCourseCoverAdmin(
    payload: UpdateCourseCoverDto,
  ): Promise<{ id: string; updated: true }> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(payload.id, user);

    const destSegments = [
      'schools',
      String(course.school_id),
      'courses',
      String(course.id),
      'images',
      'banner.png',
    ];
    const destPath = destSegments.join('/');

    if (!payload.temp_path) {
      // 如果没有传临时路径，说明是要删除现有封面
      this.storageService.deleteFile(destPath);
      course.cover_img = undefined;
    } else {
      // 移动文件并重命名为 banner.png
      this.storageService.moveFile(payload.temp_path, destPath);
      // 更新数据库，存储相对路径
      course.cover_img = `/${destPath}`;
    }

    await this.courseRepository.save(course);
    return { id: course.id, updated: true };
  }

  async updateCourseAdmin(
    payload: UpdateCourseDto,
  ): Promise<{ id: string; updated: true }> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(payload.id, user);

    if (payload.name !== undefined) {
      course.name = payload.name;
    }
    if (payload.cover_img !== undefined) {
      course.cover_img = payload.cover_img;
    }
    if (payload.status !== undefined) {
      course.status = payload.status;
    }
    if (payload.description !== undefined) {
      course.description = payload.description;
    }
    await this.courseRepository.save(course);
    return { id: course.id, updated: true };
  }

  async softDeleteCourseAdmin(
    id: string,
  ): Promise<{ id: string; deleted: true; mode: 'soft' }> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(id, user);

    course.status = Number(CourseStatusMap.UNPUBLISHED);
    await this.courseRepository.save(course);

    return { id, deleted: true, mode: 'soft' };
  }

  async hardDeleteCourseAdmin(
    id: string,
  ): Promise<{ id: string; deleted: true; mode: 'hard' }> {
    const user = await this.getCurrentUserOrThrow();
    await this.findCourseWithPermissionOrThrow(id, user);

    await this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const courseChapterRepository = manager.getRepository(CourseChapter);
      const courseLessonRepository = manager.getRepository(CourseLesson);
      const courseTeacherRepository = manager.getRepository(CourseTeacher);
      const courseStudentRepository = manager.getRepository(CourseStudent);
      const courseLearningRecordRepository =
        manager.getRepository(CourseLearningRecord);
      const courseAssignmentRepository =
        manager.getRepository(CourseAssignment);
      const courseAssignmentQuestionRepository = manager.getRepository(
        CourseAssignmentQuestion,
      );
      const assignmentSubmissionRepository =
        manager.getRepository(AssignmentSubmission);
      const assignmentAnswerDetailRepository = manager.getRepository(
        AssignmentAnswerDetail,
      );

      const chapters = await courseChapterRepository.find({
        select: ['id'],
        where: { course_id: id },
      });
      const chapterIds = chapters.map((item) => item.id);

      if (chapterIds.length > 0) {
        await courseLessonRepository.delete({ chapter_id: In(chapterIds) });
      }

      await courseTeacherRepository.delete({ course_id: id });
      await courseStudentRepository.delete({ course_id: id });
      await courseLearningRecordRepository.delete({ course_id: id });

      const assignments = await courseAssignmentRepository.find({
        select: ['id'],
        where: { course_id: id },
      });
      const assignmentIds = assignments.map((item) => item.id);

      if (assignmentIds.length > 0) {
        const submissions = await assignmentSubmissionRepository.find({
          select: ['id'],
          where: { assignment_id: In(assignmentIds) },
        });
        const submissionIds = submissions.map((item) => item.id);

        if (submissionIds.length > 0) {
          await assignmentAnswerDetailRepository.delete({
            submission_id: In(submissionIds),
          });
        }

        await assignmentSubmissionRepository.delete({
          assignment_id: In(assignmentIds),
        });
        await courseAssignmentQuestionRepository.delete({
          assignment_id: In(assignmentIds),
        });
        await courseAssignmentRepository.delete({ id: In(assignmentIds) });
      }

      await courseChapterRepository.delete({ course_id: id });
      await courseRepository.delete({ id });
    });

    return { id, deleted: true, mode: 'hard' };
  }

  async listCourseAdmin(
    query: CourseListQueryDto,
  ): Promise<{ list: CourseListItemDto[]; total: number }> {
    const user = await this.getCurrentUserOrThrow();
    const schoolId = await this.resolveSchoolIdByRole(
      user,
      query.school_id,
      true,
    );
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const baseQb = this.courseRepository
      .createQueryBuilder('course')
      .where('course.school_id = :schoolId', { schoolId });

    if (query.keyword) {
      baseQb.andWhere('course.name LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.status !== undefined) {
      baseQb.andWhere('course.status = :status', { status: query.status });
    }

    const total = await baseQb.getCount();
    const courseRows = await baseQb
      .clone()
      .leftJoin(School, 'school', 'school.id = course.school_id')
      .select([
        'course.id AS id',
        'course.school_id AS school_id',
        'school.name AS school_name',
        'course.creator_id AS creator_id',
        'course.name AS name',
        'course.cover_img AS cover_img',
        'course.status AS status',
        'course.create_time AS create_time',
        'course.update_time AS update_time',
      ])
      .orderBy('course.create_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany<CourseListRowRaw>();

    if (courseRows.length === 0) {
      return { list: [], total };
    }

    const courseIds = courseRows.map((item) => item.id);

    const teacherRows = await this.courseTeacherRepository
      .createQueryBuilder('ct')
      .innerJoin(Teacher, 'teacher', 'teacher.id = ct.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('ct.course_id', 'course_id')
      .addSelect('user.name', 'teacher_name')
      .where('ct.course_id IN (:...courseIds)', { courseIds })
      .getRawMany<TeacherNameRowRaw>();

    const creatorIds = courseRows
      .map((item) => item.creator_id)
      .filter((item) => Boolean(item));
    const creatorUsers =
      creatorIds.length > 0
        ? await this.userRepository.find({
            select: ['id', 'name'],
            where: { id: In(creatorIds) },
          })
        : [];

    const teacherNamesMap = new Map<string, Set<string>>();
    teacherRows.forEach((item) => {
      const courseId = String(item.course_id);
      const teacherName = String(item.teacher_name || '').trim();
      if (!teacherName) {
        return;
      }
      if (!teacherNamesMap.has(courseId)) {
        teacherNamesMap.set(courseId, new Set());
      }
      teacherNamesMap.get(courseId)?.add(teacherName);
    });

    const creatorNameMap = new Map<string, string>();
    creatorUsers.forEach((item) => {
      creatorNameMap.set(item.id, item.name);
    });

    const list: CourseListItemDto[] = courseRows.map((row) => {
      const rowCourseId = String(row.id);
      return {
        id: rowCourseId,
        school_id: String(row.school_id),
        creator_id: String(row.creator_id),
        school_name: row.school_name ? String(row.school_name) : '',
        name: String(row.name),
        cover_img: row.cover_img ? String(row.cover_img) : undefined,
        status: Number(row.status),
        create_time: row.create_time ? String(row.create_time) : undefined,
        update_time: row.update_time ? String(row.update_time) : undefined,
        teacher_names: Array.from(teacherNamesMap.get(rowCourseId) || []),
        creator_name: creatorNameMap.get(String(row.creator_id)),
      };
    });

    return { list, total };
  }

  async getCourseBasicAdmin(id: string): Promise<CourseBasicResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(id, user);

    const school = await this.schoolRepository.findOne({
      select: ['name'],
      where: { id: course.school_id },
    });

    const creator = await this.userRepository.findOne({
      select: ['name'],
      where: { id: course.creator_id },
    });

    const teacherRows = await this.courseTeacherRepository
      .createQueryBuilder('ct')
      .innerJoin(Teacher, 'teacher', 'teacher.id = ct.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('user.name', 'teacher_name')
      .where('ct.course_id = :courseId', { courseId: course.id })
      .getRawMany<{ teacher_name: string | null }>();

    const teacher_names = Array.from(
      new Set(
        teacherRows
          .map((item) => String(item.teacher_name || '').trim())
          .filter((item) => item.length > 0),
      ),
    );

    return {
      id: course.id,
      school_id: course.school_id,
      school_name: school?.name || '',
      creator_id: course.creator_id,
      creator_name: creator?.name,
      name: course.name,
      cover_img: course.cover_img,
      status: Number(course.status),
      create_time: course.create_time,
      update_time: course.update_time,
      teacher_names,
    };
  }

  async getCourseDescription(id: string): Promise<{ description: string }> {
    const course = await this.courseRepository.findOne({
      select: ['description'],
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    return { description: course.description || '' };
  }


  private async getCurrentUserOrThrow(): Promise<User> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (!user.role_id) {
      throw new ForbiddenException('当前用户无管理权限');
    }

    return user;
  }

  private parseRoleIds(user: User): string[] {
    return user.role_id
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private async resolveSchoolIdByRole(
    user: User,
    requestSchoolId?: string,
    requireSchoolIdForPlatform = false,
  ): Promise<string> {
    const roleIds = this.parseRoleIds(user);
    const isPlatformAdmin = roleIds.some((roleId) =>
      PlatformAdminRoles.includes(roleId),
    );
    const isSchoolAdmin = roleIds.some((roleId) =>
      SchoolAdminRoles.includes(roleId),
    );

    if (isSchoolAdmin) {
      const schoolAdmin = await this.schoolAdminRepository.findOne({
        where: { user_id: user.id },
      });
      if (!schoolAdmin?.school_id) {
        throw new BadRequestException('学校管理员未绑定学校');
      }
      if (requestSchoolId && requestSchoolId !== schoolAdmin.school_id) {
        throw new ForbiddenException('无权操作其他学校课程');
      }
      return schoolAdmin.school_id;
    }

    if (!isPlatformAdmin) {
      throw new ForbiddenException('无课程管理权限');
    }

    if (requireSchoolIdForPlatform && !requestSchoolId) {
      throw new BadRequestException('平台管理员必须提供 school_id');
    }

    if (!requestSchoolId) {
      throw new BadRequestException('缺少 school_id');
    }

    const school = await this.schoolRepository.findOneBy({
      id: requestSchoolId,
    });
    if (!school) {
      throw new BadRequestException('school_id 不存在');
    }

    return requestSchoolId;
  }

  private async findCourseWithPermissionOrThrow(
    id: string,
    user: User,
  ): Promise<Course> {
    const course = await this.courseRepository.findOneBy({ id });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const roleIds = this.parseRoleIds(user);
    const isSchoolAdmin = roleIds.some((roleId) =>
      SchoolAdminRoles.includes(roleId),
    );
    if (isSchoolAdmin) {
      const schoolAdmin = await this.schoolAdminRepository.findOne({
        where: { user_id: user.id },
      });
      if (!schoolAdmin?.school_id) {
        throw new BadRequestException('学校管理员未绑定学校');
      }
      if (schoolAdmin.school_id !== course.school_id) {
        throw new ForbiddenException('无权操作其他学校课程');
      }
    }

    const isPlatformAdmin = roleIds.some((roleId) =>
      PlatformAdminRoles.includes(roleId),
    );
    if (!isPlatformAdmin && !isSchoolAdmin) {
      throw new ForbiddenException('无课程管理权限');
    }

    return course;
  }
}
