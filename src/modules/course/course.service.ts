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
import { CourseTeachingGroup } from '@/database/entities/course_teaching_group.entity';
import { CourseGroupTeacher } from '@/database/entities/course_group_teacher.entity';
import { InvitationCode } from '@/database/entities/invitation_code.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { School } from '@/database/entities/school.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { Student } from '@/database/entities/student.entity';
import { User } from '@/database/entities/user.entity';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { v4 } from 'uuid';
import {
  BindTeachingGroupTeachersAdminDto,
  BindTeachingGroupTeachersAdminResponseDto,
  CourseBasicResponseDto,
  CourseOutlineDraftDto,
  CourseListItemDto,
  CourseListQueryDto,
  CreateTeachingGroupAdminDto,
  CreateTeachingGroupAdminResponseDto,
  CreateCourseDto,
  CreateCourseTeacherDto,
  CreateCourseResponseDto,
  DeleteTeachingGroupAdminResponseDto,
  GetTeachingGroupAdminResponseDto,
  ListTeachingGroupAdminQueryDto,
  ListTeachingGroupAdminResponseDto,
  PublishCourseOutlineDto,
  PublishCourseOutlineResponseDto,
  QuerySchoolTeacherByNameAdminDto,
  QuerySchoolTeacherByNameAdminResponseDto,
  QuickUpdateChapterTitleDto,
  QuickUpdateChapterTitleResponseDto,
  QuickUpdateLessonDto,
  QuickUpdateLessonResponseDto,
  SaveCourseDraftDto,
  TeachingGroupItemDto,
  UpdateTeachingGroupAdminDto,
  UpdateTeachingGroupAdminResponseDto,
  SaveCourseDraftResponseDto,
  UpdateCourseCoverDto,
  UpdateCourseDto,
  ListTeacherCoursesQueryDto,
  ListStudentCoursesQueryDto,
  ListMyCreatedCoursesQueryDto,
  CourseUserListResponseDto,
  TeacherSimpleDto,
  QueryLessonVideoLibraryDto,
  LessonVideoLibraryResponseDto,
  LessonVideoLibraryItemDto,
} from '@/modules/course/dto/CourseAdmin.dto';
import {
  ChapterProgressDto,
  CourseLearningProgressResponseDto,
  GetCourseLearningProgressDto,
  LessonProgressDto,
} from '@/modules/course/dto/course-learning-progress.dto';
import { SyncProgressDto } from '@/modules/course/dto/sync-progress.dto';
import { CourseStatusMap, BinaryFlagMap } from '@/common/utils/course.map';
import {
  AdminRolesMap,
  PlatformAdminRoles,
  SchoolAdminRoles,
} from '@/common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { StorageService } from '../file/storage/storage.service';
import { FileChunk } from '../file/chunk/chunk.entity';
import {
  CourseOutlineSource,
  CourseOutlineSourceMap,
} from '@/common/utils/course-outline.map';
import { InvitationTypeMap } from '@/common/utils/invite-type.map';
import {
  FileChunkStatusMap,
  FileChunkTypeMap,
} from '@/common/utils/file-chunk-admin.map';
import { UserSchoolIdentity } from '@/database/entities/user_school_identity.entity';

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

interface TeacherSimpleRowRaw {
  id: string;
  name: string | null;
}

interface GroupTeacherNameRowRaw {
  group_id: string;
  teacher_name: string | null;
}

interface GroupInvitationMetaRowRaw {
  group_id: string | null;
  invitation_create_time: string | null;
  invitation_code: string | null;
  invitation_ttl: number | string | null;
}

interface LessonVideoLibraryRowRaw {
  fileId: string;
  fileHash: string;
  fileName: string;
  targetPath: string;
}

interface SyncTeachingGroupTeachersInput {
  courseId: string;
  teachingGroupId: string;
  teacherIds: string[];
}

interface SyncTeachingGroupTeachersResult {
  added_count: number;
  removed_count: number;
  teacher_ids: string[];
}

interface PublishIdMappingItem {
  temp_id: string;
  real_id: string;
}

interface OutlineDraftRaw {
  course_id?: unknown;
  school_id?: unknown;
  status?: unknown;
  chapters?: unknown;
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
    @InjectRepository(CourseTeachingGroup)
    private readonly courseTeachingGroupRepository: Repository<CourseTeachingGroup>,
    @InjectRepository(CourseGroupTeacher)
    private readonly courseGroupTeacherRepository: Repository<CourseGroupTeacher>,
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
    @InjectRepository(InvitationCode)
    private readonly invitationCodeRepository: Repository<InvitationCode>,
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

    const roleIds = this.parseRoleIds(user);
    const isSchoolAdmin = roleIds.some((roleId) =>
      SchoolAdminRoles.includes(roleId),
    );
    let creatorId = user.id;
    if (isSchoolAdmin) {
      const identity = await this.dataSource.getRepository(UserSchoolIdentity).findOne({
        where: { user_id: user.id, school_id: schoolId, actor_type: 3, status: 1 }
      });
      if (identity) {
        creatorId = identity.actor_id;
      }
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const teachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);

      const course = courseRepository.create({
        school_id: schoolId,
        creator_id: creatorId,
        name: payload.name,
        cover_img: payload.cover_img,
        description: payload.description,
        status: Number(CourseStatusMap.UNPUBLISHED),
      });

      const createdCourse = await courseRepository.save(course);

      const defaultGroupId = v4();
      const defaultGroup = teachingGroupRepository.create({
        id: defaultGroupId,
        course_id: createdCourse.id,
        name: '默认教学组',
      });
      await teachingGroupRepository.save(defaultGroup);

      // 与课程创建流程同事务，异常将回滚课程与教学组
      this.storageService.createCourseDir({
        schoolId: createdCourse.school_id,
        courseId: createdCourse.id,
      });

      return createdCourse;
    });

    return { id: saved.id };
  }

  async createCourseUser(
    payload: CreateCourseTeacherDto,
  ): Promise<CreateCourseResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const schoolId = this.alsService.getSchoolId();
    const identity = await this.dataSource.getRepository(UserSchoolIdentity).findOne({
      where: { user_id: user.id, school_id: schoolId, actor_type: 1, status: 1 }
    });
    if (!identity) {
      throw new ForbiddenException('仅教师可创建课程');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const teachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);

      const course = courseRepository.create({
        school_id: schoolId,
        creator_id: identity.actor_id,
        name: payload.name,
        status: Number(CourseStatusMap.UNPUBLISHED),
        description: '课程简介待编辑...',
      });

      const createdCourse = await courseRepository.save(course);

      const defaultGroupId = v4();
      const defaultGroup = teachingGroupRepository.create({
        id: defaultGroupId,
        course_id: createdCourse.id,
        name: '默认教学组',
      });
      await teachingGroupRepository.save(defaultGroup);

      this.storageService.createCourseDir({
        schoolId: createdCourse.school_id,
        courseId: createdCourse.id,
      });

      return createdCourse;
    });

    return { course_id: saved.id };
  }

  async createTeachingGroupAdmin(
    payload: CreateTeachingGroupAdminDto,
  ): Promise<CreateTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );

    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('教学组名称不能为空');
    }

    const duplicate = await this.courseTeachingGroupRepository.findOne({
      select: ['id'],
      where: {
        course_id: course.id,
        name,
      },
    });
    if (duplicate) {
      throw new BadRequestException('同课程下教学组名称已存在');
    }

    const teachingGroupId = v4();
    const teachingGroup = this.courseTeachingGroupRepository.create({
      id: teachingGroupId,
      course_id: course.id,
      name,
    });
    const saved = await this.courseTeachingGroupRepository.save(teachingGroup);

    return {
      id: saved.id,
      course_id: saved.course_id,
      name: saved.name,
      teachers: [],
    };
  }

  async listTeachingGroupAdmin(
    query: ListTeachingGroupAdminQueryDto,
  ): Promise<ListTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      query.course_id,
      user,
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [rows, total] = await this.courseTeachingGroupRepository.findAndCount(
      {
        where: { course_id: course.id },
        order: {
          create_time: 'DESC',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );

    const teachersMap = await this.getTeachingGroupTeachersMap(
      rows.map((item) => item.id),
    );
    const invitationMetaMap = await this.getTeachingGroupInvitationMetaMap(
      course.id,
      rows.map((item) => item.id),
    );

    const list: TeachingGroupItemDto[] = rows.map((item) => {
      const invitationMeta = invitationMetaMap.get(item.id);
      return {
        id: item.id,
        course_id: item.course_id,
        name: item.name,
        teachers: teachersMap.get(item.id) || [],
        create_time: item.create_time,
        invitation_create_time: invitationMeta?.invitation_create_time ?? null,
        invitation_code: invitationMeta?.invitation_code ?? null,
        invitation_ttl: invitationMeta?.invitation_ttl ?? null,
      };
    });

    return {
      list,
      total,
    };
  }

  async getTeachingGroupAdmin(
    id: string,
  ): Promise<GetTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { teachingGroup } = await this.findTeachingGroupWithPermissionOrThrow(
      id,
      user,
    );
    const teachersMap = await this.getTeachingGroupTeachersMap([
      teachingGroup.id,
    ]);
    const invitationMetaMap = await this.getTeachingGroupInvitationMetaMap(
      teachingGroup.course_id,
      [teachingGroup.id],
    );
    const invitationMeta = invitationMetaMap.get(teachingGroup.id);

    return {
      id: teachingGroup.id,
      course_id: teachingGroup.course_id,
      name: teachingGroup.name,
      teachers: teachersMap.get(teachingGroup.id) || [],
      create_time: teachingGroup.create_time,
      invitation_create_time: invitationMeta?.invitation_create_time ?? null,
      invitation_ttl: invitationMeta?.invitation_ttl ?? null,
    };
  }

  async updateTeachingGroupAdmin(
    payload: UpdateTeachingGroupAdminDto,
  ): Promise<UpdateTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { course, teachingGroup } =
      await this.findTeachingGroupWithPermissionOrThrow(
        payload.teaching_group_id,
        user,
      );

    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('教学组名称不能为空');
    }

    const duplicate = await this.courseTeachingGroupRepository
      .createQueryBuilder('tg')
      .where('tg.course_id = :courseId', { courseId: course.id })
      .andWhere('tg.name = :name', { name })
      .andWhere('tg.id != :id', { id: teachingGroup.id })
      .getOne();
    if (duplicate) {
      throw new BadRequestException('同课程下教学组名称已存在');
    }

    teachingGroup.name = name;
    await this.courseTeachingGroupRepository.save(teachingGroup);

    return {
      id: teachingGroup.id,
      updated: true,
    };
  }

  async deleteTeachingGroupAdmin(
    id: string,
  ): Promise<DeleteTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { course, teachingGroup } =
      await this.findTeachingGroupWithPermissionOrThrow(id, user);

    await this.dataSource.transaction(async (manager) => {
      const teachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);
      const groupTeacherRepository = manager.getRepository(CourseGroupTeacher);
      const courseStudentRepository = manager.getRepository(CourseStudent);
      const invitationCodeRepository = manager.getRepository(InvitationCode);

      const groupCount = await teachingGroupRepository.count({
        where: { course_id: course.id },
      });
      if (groupCount <= 1) {
        throw new BadRequestException('课程至少保留一个教学组，无法删除');
      }

      const studentCount = await courseStudentRepository.count({
        where: {
          course_id: course.id,
          group_id: teachingGroup.id,
        },
      });
      if (studentCount > 0) {
        throw new BadRequestException('教学组下已有学生，无法删除');
      }

      const now = Math.floor(Date.now() / 1000);
      const activeInviteCount = await invitationCodeRepository
        .createQueryBuilder('ic')
        .where('ic.course_id = :courseId', { courseId: course.id })
        .andWhere('ic.teaching_group_id = :groupId', {
          groupId: teachingGroup.id,
        })
        .andWhere('ic.type = :type', {
          type: Number(InvitationTypeMap.STUDENT_JOIN_COURSE),
        })
        .andWhere(
          '(ic.ttl IS NULL OR ic.ttl <= 0 OR (CAST(ic.create_time AS UNSIGNED) + ic.ttl) > :now)',
          { now },
        )
        .getCount();
      if (activeInviteCount > 0) {
        throw new BadRequestException('教学组存在未失效邀请码，无法删除');
      }

      await groupTeacherRepository.delete({ group_id: teachingGroup.id });
      await invitationCodeRepository.delete({
        teaching_group_id: teachingGroup.id,
      });
      await teachingGroupRepository.delete({ id: teachingGroup.id });
      await this.syncCourseTeachersFromGroups(course.id, manager);
    });

    return {
      id,
      deleted: true,
    };
  }

  async bindTeachingGroupTeachersUser(
    payload: BindTeachingGroupTeachersAdminDto,
  ): Promise<BindTeachingGroupTeachersAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { course, teachingGroup } =
      await this.findTeachingGroupWithTeacherPermissionOrThrow(
        payload.teaching_group_id,
        user.id,
      );

    if (payload.course_id !== course.id) {
      throw new BadRequestException('课程 ID 与教学组不匹配');
    }

    const teacherIds = this.normalizeTeacherIds(payload.teacher_ids);
    if (teacherIds.length === 0) {
      throw new BadRequestException('teacher_ids 不能为空');
    }

    const teachers = await this.teacherRepository.find({
      select: ['id', 'school_id'],
      where: { id: In(teacherIds) },
    });
    if (teachers.length !== teacherIds.length) {
      throw new BadRequestException('teacher_ids 包含不存在教师');
    }

    const invalidSchoolTeacher = teachers.find(
      (teacher) => teacher.school_id !== course.school_id,
    );
    if (invalidSchoolTeacher) {
      throw new BadRequestException('teacher_ids 包含非本校教师');
    }

    const syncResult = await this.syncTeachingGroupTeachers({
      courseId: course.id,
      teachingGroupId: teachingGroup.id,
      teacherIds,
    });

    return {
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      teacher_ids: syncResult.teacher_ids,
      updated: true,
    };
  }

  async listTeachingGroupUser(
    query: ListTeachingGroupAdminQueryDto,
  ): Promise<ListTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      query.course_id,
      user.id,
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [rows, total] = await this.courseTeachingGroupRepository.findAndCount(
      {
        where: { course_id: course.id },
        order: { create_time: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );

    const teachersMap = await this.getTeachingGroupTeachersMap(
      rows.map((item) => item.id),
    );
    const invitationMetaMap = await this.getTeachingGroupInvitationMetaMap(
      course.id,
      rows.map((item) => item.id),
    );

    const list: TeachingGroupItemDto[] = rows.map((item) => {
      const invitationMeta = invitationMetaMap.get(item.id);
      return {
        id: item.id,
        course_id: item.course_id,
        name: item.name,
        teachers: teachersMap.get(item.id) || [],
        create_time: item.create_time,
        invitation_create_time: invitationMeta?.invitation_create_time ?? null,
        invitation_code: invitationMeta?.invitation_code ?? null,
        invitation_ttl: invitationMeta?.invitation_ttl ?? null,
      };
    });

    return { list, total };
  }

  async getTeachingGroupUser(
    id: string,
  ): Promise<GetTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { teachingGroup } =
      await this.findTeachingGroupWithTeacherPermissionOrThrow(id, user.id);

    const teachersMap = await this.getTeachingGroupTeachersMap([
      teachingGroup.id,
    ]);
    const invitationMetaMap = await this.getTeachingGroupInvitationMetaMap(
      teachingGroup.course_id,
      [teachingGroup.id],
    );
    const invitationMeta = invitationMetaMap.get(teachingGroup.id);

    return {
      id: teachingGroup.id,
      course_id: teachingGroup.course_id,
      name: teachingGroup.name,
      teachers: teachersMap.get(teachingGroup.id) || [],
      create_time: teachingGroup.create_time,
      invitation_create_time: invitationMeta?.invitation_create_time ?? null,
      invitation_ttl: invitationMeta?.invitation_ttl ?? null,
      invitation_code: invitationMeta?.invitation_code ?? null,
    };
  }

  async createTeachingGroupUser(
    payload: CreateTeachingGroupAdminDto,
  ): Promise<CreateTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.course_id,
      user.id,
    );

    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('教学组名称不能为空');
    }

    const duplicate = await this.courseTeachingGroupRepository.findOne({
      where: { course_id: course.id, name },
    });
    if (duplicate) {
      throw new BadRequestException('同课程下教学组名称已存在');
    }

    const teachingGroupId = v4();
    const teachingGroup = this.courseTeachingGroupRepository.create({
      id: teachingGroupId,
      course_id: course.id,
      name,
    });
    const saved = await this.courseTeachingGroupRepository.save(teachingGroup);

    return {
      id: saved.id,
      course_id: saved.course_id,
      name: saved.name,
      teachers: [],
    };
  }

  async updateTeachingGroupUser(
    payload: UpdateTeachingGroupAdminDto,
  ): Promise<UpdateTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { course, teachingGroup } =
      await this.findTeachingGroupWithTeacherPermissionOrThrow(
        payload.teaching_group_id,
        user.id,
      );

    const name = String(payload.name || '').trim();
    if (!name) {
      throw new BadRequestException('教学组名称不能为空');
    }

    const duplicate = await this.courseTeachingGroupRepository.findOne({
      where: {
        course_id: course.id,
        name,
        id: Not(teachingGroup.id),
      },
    });
    if (duplicate) {
      throw new BadRequestException('同课程下教学组名称已存在');
    }

    teachingGroup.name = name;
    await this.courseTeachingGroupRepository.save(teachingGroup);

    return {
      id: teachingGroup.id,
      updated: true,
    };
  }

  async deleteTeachingGroupUser(
    id: string,
  ): Promise<DeleteTeachingGroupAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const { course, teachingGroup } =
      await this.findTeachingGroupWithTeacherPermissionOrThrow(id, user.id);

    await this.dataSource.transaction(async (manager) => {
      const teachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);
      const groupTeacherRepository = manager.getRepository(CourseGroupTeacher);
      const invitationCodeRepository = manager.getRepository(InvitationCode);

      const groupCount = await teachingGroupRepository.count({
        where: { course_id: course.id },
      });
      if (groupCount <= 1) {
        throw new BadRequestException('课程至少保留一个教学组，无法删除');
      }

      await groupTeacherRepository.delete({ group_id: teachingGroup.id });
      await invitationCodeRepository.delete({
        teaching_group_id: teachingGroup.id,
      });
      await teachingGroupRepository.delete({ id: teachingGroup.id });
      await this.syncCourseTeachersFromGroups(course.id, manager);
    });

    return { id: teachingGroup.id, deleted: true };
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

  async updateCourseUser(
    payload: UpdateCourseDto,
  ): Promise<{ id: string; updated: true }> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.id,
      user.id,
    );

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

  async saveCourseDraftAdmin(
    payload: SaveCourseDraftDto,
  ): Promise<SaveCourseDraftResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );
      const courseRepo = manager.getRepository(Course);
      await courseRepo.update(course.id, {
        draft_content: payload.draft_content as any,
      });
    });

    return { course_id: course.id, updated: true };
  }

  async saveCourseDraftUser(
    payload: SaveCourseDraftDto,
  ): Promise<SaveCourseDraftResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.course_id,
      user.id,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );
      const courseRepo = manager.getRepository(Course);
      await courseRepo.update(course.id, {
        draft_content: payload.draft_content as any,
      });
    });

    return { course_id: course.id, updated: true };
  }

  async publishCourseOutlineAdmin(
    payload: PublishCourseOutlineDto,
  ): Promise<PublishCourseOutlineResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    return this.executePublishCourseOutlineDB(
      course,
      payload.draft_content as unknown as Record<string, unknown>,
    );
  }

  async publishCourseOutlineUser(
    payload: PublishCourseOutlineDto,
  ): Promise<PublishCourseOutlineResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.course_id,
      user.id,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    return this.executePublishCourseOutlineDB(
      course,
      payload.draft_content as unknown as Record<string, unknown>,
    );
  }

  private async processLessonVideoFile(
    manager: EntityManager,
    schoolId: string,
    tempPath: string,
  ): Promise<string> {
    const match = tempPath.match(/^uploads\/temp\/videos\/(.+)$/);
    if (!match) return tempPath;

    const fileName = match[1];
    const dotIndex = fileName.lastIndexOf('.');
    const fileHash =
      dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    const ext = dotIndex !== -1 ? fileName.substring(dotIndex) : '.mp4';

    const dir1 = fileHash.substring(0, 2);
    const dir2 = fileHash.substring(2, 4);

    const destRelativeDir = `schools/${schoolId}/resource_library/videos/${dir1}/${dir2}`;
    const destRelativePath = `${destRelativeDir}/${fileHash}${ext}`;

    this.storageService.moveFile(tempPath, destRelativePath);

    const chunkRepo = manager.getRepository(FileChunk);
    const chunkRecord = await chunkRepo.findOne({ where: { fileHash } });
    if (chunkRecord) {
      chunkRecord.targetPath = destRelativeDir;
      await chunkRepo.save(chunkRecord);
    }

    return `/${destRelativePath}`;
  }

  private async processAllTempVideosInDraft(
    manager: EntityManager,
    schoolId: string,
    draftContent: any,
  ): Promise<void> {
    if (!draftContent || !Array.isArray(draftContent.chapters)) return;
    for (const chapter of draftContent.chapters) {
      if (Array.isArray(chapter.lessons)) {
        for (const lesson of chapter.lessons) {
          if (
            typeof lesson.video_path === 'string' &&
            lesson.video_path.startsWith('uploads/temp/videos/')
          ) {
            lesson.video_path = await this.processLessonVideoFile(
              manager,
              schoolId,
              lesson.video_path,
            );
          }
        }
      }
    }
  }

  private async executePublishCourseOutlineDB(
    course: Course,
    draft_content: Record<string, unknown>,
  ): Promise<PublishCourseOutlineResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const chapterRepository = manager.getRepository(CourseChapter);
      const lessonRepository = manager.getRepository(CourseLesson);

      const courseEntity = await courseRepository.findOneBy({ id: course.id });
      if (!courseEntity) {
        throw new NotFoundException('课程不存在');
      }

      // 先落草稿，再执行后续发布差异同步（同事务，失败会整体回滚）
      courseEntity.draft_content = draft_content;
      await courseRepository.save(courseEntity);

      const existingChapters = await chapterRepository.find({
        where: { course_id: course.id },
      });
      const existingChapterMap = new Map(
        existingChapters.map((chapter) => [chapter.id, chapter]),
      );
      const keepChapterIds = new Set<string>();
      const chapterIdMap = new Map<string, string>();
      const chapterMappings: PublishIdMappingItem[] = [];

      const draftChapters = (draft_content.chapters as any[]) || [];

      for (const chapterItem of draftChapters) {
        const chapterId = String(chapterItem.chapter_id);
        if (this.isTempId(chapterId)) {
          const createdChapter = chapterRepository.create({
            course_id: course.id,
            title: chapterItem.title,
            sort_order: Number(chapterItem.sort_order ?? 0),
          });
          const savedChapter = await chapterRepository.save(createdChapter);
          keepChapterIds.add(savedChapter.id);
          chapterIdMap.set(chapterId, savedChapter.id);
          chapterMappings.push({
            temp_id: chapterId,
            real_id: savedChapter.id,
          });
        } else {
          const chapter = existingChapterMap.get(chapterId);
          if (!chapter) {
            throw new BadRequestException(
              `章节ID不合法: ${chapterId}。builder新建章节必须使用temp前缀ID（如 temp_chapter_时间戳_随机串）`,
            );
          }
          chapter.title = chapterItem.title;
          chapter.sort_order = Number(chapterItem.sort_order ?? 0);
          const savedChapter = await chapterRepository.save(chapter);
          keepChapterIds.add(savedChapter.id);
          chapterIdMap.set(chapterId, savedChapter.id);
        }
      }

      const existingChapterIds = existingChapters.map((chapter) => chapter.id);
      const existingLessons =
        existingChapterIds.length > 0
          ? await lessonRepository.find({
              where: { chapter_id: In(existingChapterIds) },
            })
          : [];
      const existingLessonMap = new Map(
        existingLessons.map((lesson) => [lesson.id, lesson]),
      );
      const keepLessonIds = new Set<string>();
      const lessonMappings: PublishIdMappingItem[] = [];

      for (const chapterItem of draftChapters) {
        const chapterId = String(chapterItem.chapter_id);
        const realChapterId = chapterIdMap.get(chapterId);
        if (!realChapterId) {
          throw new BadRequestException(`章节ID映射不存在: ${chapterId}`);
        }

        for (const lessonItem of chapterItem.lessons || []) {
          const lessonId = String(lessonItem.lesson_id);
          const videoPath = lessonItem.video_path
            ? await this.processLessonVideoFile(
                manager,
                course.school_id,
                lessonItem.video_path,
              )
            : null;
          lessonItem.video_path = videoPath;

          if (this.isTempId(lessonId)) {
            const createdLesson: CourseLesson = lessonRepository.create({
              chapter_id: realChapterId,
              title: lessonItem.title,
              description: lessonItem.description || '',
              video_path: videoPath,
              duration: Number(lessonItem.duration ?? 0),
              sort_order: Number(lessonItem.sort_order ?? 0),
            });
            const savedLesson: CourseLesson =
              await lessonRepository.save(createdLesson);
            keepLessonIds.add(savedLesson.id);
            lessonMappings.push({
              temp_id: lessonId,
              real_id: savedLesson.id,
            });
          } else {
            const lesson = existingLessonMap.get(lessonId);
            if (!lesson) {
              throw new BadRequestException(
                `课时ID不合法: ${lessonId}。builder新建课时必须使用temp前缀ID（如 temp_lesson_时间戳_随机串）`,
              );
            }
            lesson.chapter_id = realChapterId;
            lesson.title = lessonItem.title;
            lesson.description = lessonItem.description || '';
            lesson.video_path = videoPath;
            lesson.duration = Number(lessonItem.duration ?? 0);
            lesson.sort_order = Number(lessonItem.sort_order ?? 0);
            const savedLesson = await lessonRepository.save(lesson);
            keepLessonIds.add(savedLesson.id);
          }
        }
      }

      const lessonIdsToDelete = existingLessons
        .filter((lesson) => !keepLessonIds.has(lesson.id))
        .map((lesson) => lesson.id);

      if (lessonIdsToDelete.length > 0) {
        await lessonRepository.delete({ id: In(lessonIdsToDelete) });
      }

      const chapterIdsToDelete = existingChapters
        .filter((chapter) => !keepChapterIds.has(chapter.id))
        .map((chapter) => chapter.id);

      if (chapterIdsToDelete.length > 0) {
        await lessonRepository.delete({ chapter_id: In(chapterIdsToDelete) });
        await chapterRepository.delete({ id: In(chapterIdsToDelete) });
      }

      courseEntity.status = Number(CourseStatusMap.PUBLISHED);
      courseEntity.draft_content = { ...draft_content };
      await courseRepository.save(courseEntity);

      const chapter_count = await chapterRepository.count({
        where: { course_id: course.id },
      });

      const lesson_count =
        chapter_count === 0
          ? 0
          : await lessonRepository
              .createQueryBuilder('lesson')
              .innerJoin(
                CourseChapter,
                'chapter',
                'chapter.id = lesson.chapter_id',
              )
              .where('chapter.course_id = :courseId', { courseId: course.id })
              .getCount();

      return {
        course_id: course.id,
        published: true,
        chapter_count,
        lesson_count,
        id_mappings: {
          chapters: chapterMappings,
          lessons: lessonMappings,
        },
      };
    });
  }

  async updateChapterTitleQuickAdmin(
    payload: QuickUpdateChapterTitleDto,
  ): Promise<QuickUpdateChapterTitleResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );
      const chapterRepo = manager.getRepository(CourseChapter);
      const chapter = await chapterRepo.findOne({
        where: { id: payload.chapter.chapter_id, course_id: course.id },
      });
      if (!chapter) throw new NotFoundException('章节不存在');

      chapter.title = payload.chapter.title;
      await chapterRepo.save(chapter);

      await manager
        .getRepository(Course)
        .update(course.id, { draft_content: payload.draft_content as any });
    });

    return {
      course_id: course.id,
      chapter_id: payload.chapter.chapter_id,
      updated: true,
    };
  }

  async updateChapterTitleQuickUser(
    payload: QuickUpdateChapterTitleDto,
  ): Promise<QuickUpdateChapterTitleResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.course_id,
      user.id,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );
      const chapterRepo = manager.getRepository(CourseChapter);
      const chapter = await chapterRepo.findOne({
        where: { id: payload.chapter.chapter_id, course_id: course.id },
      });
      if (!chapter) throw new NotFoundException('章节不存在');

      chapter.title = payload.chapter.title;
      await chapterRepo.save(chapter);

      await manager
        .getRepository(Course)
        .update(course.id, { draft_content: payload.draft_content as any });
    });

    return {
      course_id: course.id,
      chapter_id: payload.chapter.chapter_id,
      updated: true,
    };
  }

  async updateLessonQuickAdmin(
    payload: QuickUpdateLessonDto,
  ): Promise<QuickUpdateLessonResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      if (
        payload.lesson.video_path &&
        payload.lesson.video_path.startsWith('uploads/temp/videos/')
      ) {
        payload.lesson.video_path = await this.processLessonVideoFile(
          manager,
          course.school_id,
          payload.lesson.video_path,
        );
      }
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );

      const chapterRepo = manager.getRepository(CourseChapter);
      const lessonRepo = manager.getRepository(CourseLesson);

      const chapter = await chapterRepo.findOne({
        where: { id: payload.lesson.chapter_id, course_id: course.id },
      });
      if (!chapter) throw new NotFoundException('章节不存在');

      const lesson = await lessonRepo
        .createQueryBuilder('lesson')
        .innerJoin(CourseChapter, 'chapter', 'chapter.id = lesson.chapter_id')
        .where('lesson.id = :lessonId', { lessonId: payload.lesson.lesson_id })
        .andWhere('chapter.course_id = :courseId', { courseId: course.id })
        .getOne();
      if (!lesson) throw new NotFoundException('课时不存在');

      await manager
        .getRepository(Course)
        .update(course.id, { draft_content: payload.draft_content as any });

      lesson.chapter_id = chapter.id;
      lesson.title = payload.lesson.title;
      lesson.description = payload.lesson.description || '';
      lesson.video_path = payload.lesson.video_path ?? null;
      lesson.duration = Number(payload.lesson.duration ?? 0);
      lesson.sort_order = Number(payload.lesson.sort_order ?? 0);

      await lessonRepo.save(lesson);
    });

    return {
      course_id: course.id,
      lesson_id: payload.lesson.lesson_id,
      updated: true,
    };
  }

  async updateLessonQuickUser(
    payload: QuickUpdateLessonDto,
  ): Promise<QuickUpdateLessonResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      payload.course_id,
      user.id,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    await this.dataSource.transaction(async (manager) => {
      if (
        payload.lesson.video_path &&
        payload.lesson.video_path.startsWith('uploads/temp/videos/')
      ) {
        payload.lesson.video_path = await this.processLessonVideoFile(
          manager,
          course.school_id,
          payload.lesson.video_path,
        );
      }
      await this.processAllTempVideosInDraft(
        manager,
        course.school_id,
        payload.draft_content,
      );

      const chapterRepo = manager.getRepository(CourseChapter);
      const lessonRepo = manager.getRepository(CourseLesson);

      const chapter = await chapterRepo.findOne({
        where: { id: payload.lesson.chapter_id, course_id: course.id },
      });
      if (!chapter) throw new NotFoundException('章节不存在');

      const lesson = await lessonRepo
        .createQueryBuilder('lesson')
        .innerJoin(CourseChapter, 'chapter', 'chapter.id = lesson.chapter_id')
        .where('lesson.id = :lessonId', { lessonId: payload.lesson.lesson_id })
        .andWhere('chapter.course_id = :courseId', { courseId: course.id })
        .getOne();
      if (!lesson) throw new NotFoundException('课时不存在');

      await manager
        .getRepository(Course)
        .update(course.id, { draft_content: payload.draft_content as any });

      lesson.chapter_id = chapter.id;
      lesson.title = payload.lesson.title;
      lesson.description = payload.lesson.description || '';
      lesson.video_path = payload.lesson.video_path ?? null;
      lesson.duration = Number(payload.lesson.duration ?? 0);
      lesson.sort_order = Number(payload.lesson.sort_order ?? 0);

      await lessonRepo.save(lesson);
    });

    return {
      course_id: course.id,
      lesson_id: payload.lesson.lesson_id,
      updated: true,
    };
  }

  async queryLessonVideoLibraryAdmin(
    query: QueryLessonVideoLibraryDto,
  ): Promise<LessonVideoLibraryResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      query.course_id,
      user,
    );
    return this.queryLessonVideoLibraryBySchool(course.school_id, query);
  }

  async queryLessonVideoLibraryUser(
    query: QueryLessonVideoLibraryDto,
  ): Promise<LessonVideoLibraryResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithTeacherPermissionOrThrow(
      query.course_id,
      user.id,
    );
    return this.queryLessonVideoLibraryBySchool(course.school_id, query);
  }

  private async queryLessonVideoLibraryBySchool(
    schoolId: string,
    query: QueryLessonVideoLibraryDto,
  ): Promise<LessonVideoLibraryResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.filename?.trim();

    const fileChunkRepo = this.dataSource.getRepository(FileChunk);
    const qb = fileChunkRepo
      .createQueryBuilder('fc')
      .where('fc.school_id = :schoolId', { schoolId })
      .andWhere('fc.status = :status', { status: FileChunkStatusMap.done })
      .andWhere('fc.type = :type', { type: FileChunkTypeMap.VIDEO })
      .andWhere('fc.target_path LIKE :schoolsPrefix', {
        schoolsPrefix: 'schools/%',
      })
      .andWhere('fc.target_path LIKE :videoPathPrefix', {
        videoPathPrefix: `schools/${schoolId}/resource_library/videos/%`,
      });

    if (keyword) {
      qb.andWhere('fc.file_name LIKE :filename', {
        filename: `%${keyword}%`,
      });
    }

    const total = await qb.getCount();
    const rows = await qb
      .select([
        'fc.id AS fileId',
        'fc.file_hash AS fileHash',
        'fc.file_name AS fileName',
        'fc.target_path AS targetPath',
      ])
      .orderBy('fc.update_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany<LessonVideoLibraryRowRaw>();

    const list: LessonVideoLibraryItemDto[] = rows.map((row) => ({
      fileName: String(row.fileName),
      fileId: String(row.fileId),
      fileHash: String(row.fileHash),
      target_path: String(row.targetPath),
    }));

    return {
      list,
      total,
    };
  }

  async bindTeachingGroupTeachersAdmin(
    payload: BindTeachingGroupTeachersAdminDto,
  ): Promise<BindTeachingGroupTeachersAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );

    const teachingGroup = await this.courseTeachingGroupRepository.findOne({
      where: {
        id: payload.teaching_group_id,
        course_id: course.id,
      },
    });
    if (!teachingGroup) {
      throw new NotFoundException('教学组不存在');
    }

    const teacherIds = this.normalizeTeacherIds(payload.teacher_ids);
    if (teacherIds.length === 0) {
      throw new BadRequestException('teacher_ids 不能为空');
    }

    const teachers = await this.teacherRepository.find({
      select: ['id', 'school_id'],
      where: { id: In(teacherIds) },
    });
    if (teachers.length !== teacherIds.length) {
      throw new BadRequestException('teacher_ids 包含不存在教师');
    }
    const invalidSchoolTeacher = teachers.find(
      (teacher) => teacher.school_id !== course.school_id,
    );
    if (invalidSchoolTeacher) {
      throw new BadRequestException('teacher_ids 包含非本校教师');
    }

    const syncResult = await this.syncTeachingGroupTeachers({
      courseId: course.id,
      teachingGroupId: teachingGroup.id,
      teacherIds,
    });

    return {
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      teacher_ids: syncResult.teacher_ids,
      updated: true,
    };
  }

  async querySchoolTeacherByNameAdmin(
    query: QuerySchoolTeacherByNameAdminDto,
  ): Promise<QuerySchoolTeacherByNameAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const schoolId = await this.resolveSchoolIdByRole(
      user,
      query.school_id,
      true,
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = String(query.name || '').trim();
    if (!keyword) {
      throw new BadRequestException('name 不能为空');
    }

    const qb = this.teacherRepository
      .createQueryBuilder('teacher')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('teacher.id', 'id')
      .addSelect('user.name', 'name')
      .where('teacher.school_id = :schoolId', { schoolId })
      // 左到右前缀匹配，避免包含匹配导致误命中
      .andWhere('user.name LIKE :name', { name: `${keyword}%` });

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('user.name', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<TeacherSimpleRowRaw>();

    return {
      list: rows.map((item) => ({
        id: String(item.id),
        name: String(item.name || ''),
      })),
      total,
    };
  }

  async querySchoolTeacherByNameUser(
    query: QuerySchoolTeacherByNameAdminDto,
  ): Promise<QuerySchoolTeacherByNameAdminResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const teacher = await this.teacherRepository.findOne({
      where: { user_id: user.id },
    });
    if (!teacher) {
      throw new ForbiddenException('仅教师可查询');
    }

    const schoolId = teacher.school_id;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = String(query.name || '').trim();
    if (!keyword) {
      throw new BadRequestException('name 不能为空');
    }

    const qb = this.teacherRepository
      .createQueryBuilder('teacher')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('teacher.id', 'id')
      .addSelect('user.name', 'name')
      .where('teacher.school_id = :schoolId', { schoolId })
      .andWhere('user.name LIKE :name', { name: `${keyword}%` });

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('user.name', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<TeacherSimpleRowRaw>();

    return {
      list: rows.map((item) => ({
        id: String(item.id),
        name: String(item.name || ''),
      })),
      total,
    };
  }

  async getCourseLessonOutline(
    id: string,
    source?: string,
  ): Promise<CourseOutlineDraftDto> {
    const course = await this.courseRepository.findOneBy({ id });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const platform = this.alsService.getStore()?.platform;
    let shouldShowDraft = false;

    if (platform === 'admin') {
      const adminSource: CourseOutlineSource =
        source === CourseOutlineSourceMap.PUBLISHED
          ? CourseOutlineSourceMap.PUBLISHED
          : CourseOutlineSourceMap.DRAFT;
      shouldShowDraft = adminSource !== CourseOutlineSourceMap.PUBLISHED;
    } else {
      // 教师用户端如果是该课程创作人，则返回草稿
      const userId = this.alsService.getUserId();
      if (userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (user && this.parseRoleIds(user).includes(AdminRolesMap.teacher)) {
          const schoolId = this.alsService.getSchoolId();
          const identity = await this.dataSource.getRepository(UserSchoolIdentity).findOne({
            where: { user_id: user.id, school_id: schoolId, actor_type: 1, status: 1 }
          });
          if (identity && course.creator_id === identity.actor_id) {
            shouldShowDraft = true;
          }
        }
      }
    }

    if (shouldShowDraft) {
      const draft = this.parseDraftContent(course.draft_content);
      if (draft) {
        return this.normalizeOutlineDraft(draft, course);
      }
    }

    return this.buildOutlineFromDatabase(course);
  }

  async importPublishedCourseLessonOutlineAdmin(
    id: string,
  ): Promise<CourseOutlineDraftDto> {
    const user = await this.getCurrentUserOrThrow();
    await this.findCourseWithPermissionOrThrow(id, user);

    return this.getCourseLessonOutline(id, CourseOutlineSourceMap.PUBLISHED);
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
      const courseTeachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);
      const courseGroupTeacherRepository =
        manager.getRepository(CourseGroupTeacher);
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

      const teachingGroups = await courseTeachingGroupRepository.find({
        select: ['id'],
        where: { course_id: id },
      });
      const teachingGroupIds = teachingGroups.map((item) => item.id);
      if (teachingGroupIds.length > 0) {
        await courseGroupTeacherRepository.delete({
          group_id: In(teachingGroupIds),
        });
      }
      await courseTeachingGroupRepository.delete({ course_id: id });

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
    const teachersMap = new Map<string, TeacherSimpleDto[]>();
    const teacherRows = await this.courseTeacherRepository
      .createQueryBuilder('ct')
      .innerJoin(Teacher, 'teacher', 'teacher.id = ct.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('ct.course_id', 'course_id')
      .addSelect('teacher.id', 'teacher_id')
      .addSelect('user.name', 'teacher_name')
      .where('ct.course_id IN (:...courseIds)', { courseIds })
      .getRawMany<any>();

    teacherRows.forEach((row) => {
      const courseId = String(row.course_id);
      if (!teachersMap.has(courseId)) {
        teachersMap.set(courseId, []);
      }
      const list = teachersMap.get(courseId)!;
      if (!list.find((t) => t.id === String(row.teacher_id))) {
        list.push({
          id: String(row.teacher_id),
          name: String(row.teacher_name),
        });
      }
    });

    const creatorIds = courseRows
      .map((item) => item.creator_id)
      .filter((item) => Boolean(item));

    // 1. 从 User 表查 (针对平台管理员)
    const creatorUsers =
      creatorIds.length > 0
        ? await this.userRepository.find({
            select: ['id', 'name'],
            where: { id: In(creatorIds) },
          })
        : [];

    // 2. 从 Teacher 表 (+ User) 查
    const creatorTeachers =
      creatorIds.length > 0
        ? await this.teacherRepository
            .createQueryBuilder('t')
            .innerJoin(User, 'u', 'u.id = t.user_id')
            .select('t.id', 'id')
            .addSelect('u.name', 'name')
            .where('t.id IN (:...creatorIds)', { creatorIds })
            .getRawMany()
        : [];

    // 3. 从 SchoolAdmin 表 (+ User) 查
    const creatorSchoolAdmins =
      creatorIds.length > 0
        ? await this.schoolAdminRepository
            .createQueryBuilder('sa')
            .innerJoin(User, 'u', 'u.id = sa.user_id')
            .select('sa.id', 'id')
            .addSelect('u.name', 'name')
            .where('sa.id IN (:...creatorIds)', { creatorIds })
            .getRawMany()
        : [];

    const creatorNameMap = new Map<string, string>();
    creatorUsers.forEach((item) => creatorNameMap.set(item.id, item.name));
    creatorTeachers.forEach((item) =>
      creatorNameMap.set(String(item.id), String(item.name)),
    );
    creatorSchoolAdmins.forEach((item) =>
      creatorNameMap.set(String(item.id), String(item.name)),
    );

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
        teacher_names: teachersMap.get(rowCourseId) || [],
        creator_name: creatorNameMap.get(String(row.creator_id)),
      };
    });

    return { list, total };
  }

  async listTeacherCoursesUser(
    query: ListTeacherCoursesQueryDto,
  ): Promise<CourseUserListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const teacherId = this.alsService.getActorId();
    const schoolId = this.alsService.getSchoolId();

    if (!teacherId || !schoolId) {
      throw new ForbiddenException('应用上下文缺失，请重新登录选校');
    }

    const baseQb = this.courseGroupTeacherRepository
      .createQueryBuilder('cgt')
      .innerJoin(CourseTeachingGroup, 'ctg', 'ctg.id = cgt.group_id')
      .innerJoin(Course, 'course', 'course.id = ctg.course_id')
      .innerJoin(School, 'school', 'school.id = course.school_id')
      .select([
        'course.id AS course_id',
        'course.school_id AS school_id',
        'course.creator_id AS creator_id',
        'course.name AS name',
        'course.cover_img AS cover_img',
        'course.status AS status',
        'course.create_time AS create_time',
        'course.update_time AS update_time',
        'school.name AS school_name',
        'cgt.group_id AS group_id',
      ])
      .where('cgt.teacher_id = :teacherId', { teacherId })
      .andWhere('course.status = :status', {
        status: CourseStatusMap.PUBLISHED,
      })
      .andWhere('course.school_id = :schoolId', { schoolId });

    const total = await baseQb.getCount();
    const rows = await baseQb
      .orderBy('course.create_time', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<any>();

    if (rows.length === 0) {
      return { list: [], total };
    }

    const groupIds = rows.map((row) => row.group_id);
    const teachersMap = await this.getTeachingGroupTeachersMap(groupIds);

    const list = rows.map((row) => ({
      course_id: String(row.course_id),
      school_id: String(row.school_id),
      creator_id: String(row.creator_id),
      name: String(row.name),
      cover_img: row.cover_img ? String(row.cover_img) : undefined,
      status: Number(row.status),
      create_time: row.create_time ? String(row.create_time) : undefined,
      update_time: row.update_time ? String(row.update_time) : undefined,
      school_name: String(row.school_name || ''),
      group_id: String(row.group_id),
      teacher_names: teachersMap.get(String(row.group_id)) || [],
    }));

    return { list, total };
  }

  async listMyCreatedCourses(
    query: ListMyCreatedCoursesQueryDto,
    userId: string,
  ): Promise<CourseUserListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const schoolId = this.alsService.getSchoolId();
    const identity = await this.dataSource.getRepository(UserSchoolIdentity).findOne({
      where: { user_id: userId, school_id: schoolId, actor_type: 1, status: 1 }
    });
    const realCreatorId = identity ? identity.actor_id : userId;

    const baseQb = this.courseRepository
      .createQueryBuilder('course')
      .innerJoin(School, 'school', 'school.id = course.school_id')
      .select([
        'course.id AS course_id',
        'course.school_id AS school_id',
        'course.creator_id AS creator_id',
        'course.name AS name',
        'course.cover_img AS cover_img',
        'course.status AS status',
        'course.create_time AS create_time',
        'course.update_time AS update_time',
        'school.name AS school_name',
      ])
      .where('course.creator_id = :creatorId', { creatorId: realCreatorId });

    if (query.school_id) {
      baseQb.andWhere('course.school_id = :schoolId', {
        schoolId: query.school_id,
      });
    }

    if (query.keyword) {
      baseQb.andWhere('course.name LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    const total = await baseQb.getCount();
    const rows = await baseQb
      .orderBy('course.create_time', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<any>();

    if (rows.length === 0) {
      return { list: [], total };
    }

    const courseIds = rows.map((row) => row.course_id);

    // 获取所有教学组，以便为每个课程找一个 group_id
    const groups = await this.courseTeachingGroupRepository.find({
      where: { course_id: In(courseIds) },
      order: { create_time: 'ASC' },
    });

    const courseGroupMap = new Map<string, string>();
    groups.forEach((g) => {
      if (!courseGroupMap.has(g.course_id)) {
        courseGroupMap.set(g.course_id, g.id);
      }
    });

    // 获取所有任课老师列表 (不分教学组)
    const teacherRows = await this.courseTeacherRepository
      .createQueryBuilder('ct')
      .innerJoin(Teacher, 'teacher', 'teacher.id = ct.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('ct.course_id', 'course_id')
      .addSelect('teacher.id', 'teacher_id')
      .addSelect('user.name', 'teacher_name')
      .where('ct.course_id IN (:...courseIds)', { courseIds })
      .getRawMany<any>();

    const courseTeachersMap = new Map<string, TeacherSimpleDto[]>();
    teacherRows.forEach((row) => {
      const courseId = String(row.course_id);
      if (!courseTeachersMap.has(courseId)) {
        courseTeachersMap.set(courseId, []);
      }
      const teachers = courseTeachersMap.get(courseId)!;
      if (!teachers.find((t) => t.id === String(row.teacher_id))) {
        teachers.push({
          id: String(row.teacher_id),
          name: String(row.teacher_name),
        });
      }
    });

    const list = rows.map((row) => ({
      course_id: String(row.course_id),
      school_id: String(row.school_id),
      creator_id: String(row.creator_id),
      name: String(row.name),
      cover_img: row.cover_img ? String(row.cover_img) : undefined,
      status: Number(row.status),
      create_time: row.create_time ? String(row.create_time) : undefined,
      update_time: row.update_time ? String(row.update_time) : undefined,
      school_name: String(row.school_name || ''),
      group_id: courseGroupMap.get(row.course_id) || '',
      teacher_names: courseTeachersMap.get(row.course_id) || [],
    }));

    return { list, total };
  }

  async listStudentCoursesUser(
    query: ListStudentCoursesQueryDto,
  ): Promise<CourseUserListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const studentId = this.alsService.getActorId();
    const schoolId = this.alsService.getSchoolId();

    if (!studentId || !schoolId) {
      throw new ForbiddenException('应用上下文缺失，请重新登录选校');
    }

    const baseQb = this.courseStudentRepository
      .createQueryBuilder('cs')
      .innerJoin(Course, 'course', 'course.id = cs.course_id')
      .innerJoin(School, 'school', 'school.id = course.school_id')
      .select([
        'course.id AS course_id',
        'course.school_id AS school_id',
        'course.creator_id AS creator_id',
        'course.name AS name',
        'course.cover_img AS cover_img',
        'course.status AS status',
        'course.create_time AS create_time',
        'course.update_time AS update_time',
        'school.name AS school_name',
        'cs.group_id AS group_id',
      ])
      .where('cs.student_id = :studentId', { studentId })
      .andWhere('course.school_id = :schoolId', { schoolId });

    const total = await baseQb.getCount();
    const rows = await baseQb
      .orderBy('course.create_time', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<any>();

    if (rows.length === 0) {
      return { list: [], total };
    }

    const groupIds = rows
      .map((row) => row.group_id)
      .filter((id) => Boolean(id));

    const teachersMap =
      groupIds.length > 0
        ? await this.getTeachingGroupTeachersMap(groupIds)
        : new Map<string, TeacherSimpleDto[]>();

    const list = rows.map((row) => ({
      course_id: String(row.course_id),
      school_id: String(row.school_id),
      creator_id: String(row.creator_id),
      name: String(row.name),
      cover_img: row.cover_img ? String(row.cover_img) : undefined,
      status: Number(row.status),
      create_time: row.create_time ? String(row.create_time) : undefined,
      update_time: row.update_time ? String(row.update_time) : undefined,
      school_name: String(row.school_name || ''),
      group_id: String(row.group_id || ''),
      teacher_names: row.group_id ? teachersMap.get(row.group_id) || [] : [],
    }));

    return { list, total };
  }

  async getCourseBasicAdmin(id: string): Promise<CourseBasicResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(id, user);

    const school = await this.schoolRepository.findOne({
      select: ['name'],
      where: { id: course.school_id },
    });

    // 解析 creator_name，支持 user.id, teacher.id, school_admin.id
    let creatorName = '';
    const creatorId = course.creator_id;

    // 1. 尝试从 User 表找 (平台管理员)
    const userCreator = await this.userRepository.findOne({
      select: ['name'],
      where: { id: creatorId },
    });
    if (userCreator) {
      creatorName = userCreator.name;
    } else {
      // 2. 尝试从 Teacher 表找
      const teacherCreator = await this.teacherRepository
        .createQueryBuilder('t')
        .innerJoin(User, 'u', 'u.id = t.user_id')
        .select('u.name', 'name')
        .where('t.id = :creatorId', { creatorId })
        .getRawOne();
      if (teacherCreator) {
        creatorName = teacherCreator.name;
      } else {
        // 3. 尝试从 SchoolAdmin 表找
        const schoolAdminCreator = await this.schoolAdminRepository
          .createQueryBuilder('sa')
          .innerJoin(User, 'u', 'u.id = sa.user_id')
          .select('u.name', 'name')
          .where('sa.id = :creatorId', { creatorId })
          .getRawOne();
        if (schoolAdminCreator) {
          creatorName = schoolAdminCreator.name;
        }
      }
    }

    const teacherRows = await this.courseTeacherRepository
      .createQueryBuilder('ct')
      .innerJoin(Teacher, 'teacher', 'teacher.id = ct.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('teacher.id', 'teacher_id')
      .addSelect('user.name', 'teacher_name')
      .where('ct.course_id = :courseId', { courseId: course.id })
      .getRawMany<any>();

    const teacher_names: TeacherSimpleDto[] = teacherRows.map((item) => ({
      id: String(item.teacher_id),
      name: String(item.teacher_name || '').trim(),
    }));

    return {
      id: course.id,
      school_id: course.school_id,
      school_name: school?.name || '',
      creator_id: course.creator_id,
      creator_name: creatorName,
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

  async getCourseBaseInfo(id: string): Promise<{
    creator_id: string;
    course_id: string;
    course_name: string;
    course_cover: string | null;
    publish_status: number;
  }> {
    const course = await this.courseRepository.findOne({
      select: ['creator_id', 'id', 'name', 'cover_img', 'status'],
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    return {
      creator_id: course.creator_id,
      course_id: course.id,
      course_name: course.name,
      course_cover: course.cover_img ?? null,
      publish_status: Number(course.status),
    };
  }

  private async getTeachingGroupTeachersMap(
    groupIds: string[],
  ): Promise<Map<string, TeacherSimpleDto[]>> {
    if (groupIds.length === 0) {
      return new Map();
    }

    const rows = await this.courseGroupTeacherRepository
      .createQueryBuilder('cgt')
      .innerJoin(Teacher, 'teacher', 'teacher.id = cgt.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('cgt.group_id', 'group_id')
      .addSelect('teacher.id', 'teacher_id')
      .addSelect('user.name', 'teacher_name')
      .where('cgt.group_id IN (:...groupIds)', { groupIds })
      .getRawMany<any>();

    const teacherMap = new Map<string, TeacherSimpleDto[]>();
    rows.forEach((item) => {
      const groupId = String(item.group_id || '').trim();
      const teacherId = String(item.teacher_id || '').trim();
      const teacherName = String(item.teacher_name || '').trim();
      if (!groupId || !teacherId || !teacherName) {
        return;
      }
      if (!teacherMap.has(groupId)) {
        teacherMap.set(groupId, []);
      }
      teacherMap.get(groupId)?.push({ id: teacherId, name: teacherName });
    });

    return teacherMap;
  }

  private async getTeachingGroupInvitationMetaMap(
    courseId: string,
    groupIds: string[],
  ): Promise<
    Map<
      string,
      {
        invitation_create_time: string | null;
        invitation_code: string | null;
        invitation_ttl: number | null;
      }
    >
  > {
    if (groupIds.length === 0) {
      return new Map();
    }

    const rows = await this.invitationCodeRepository
      .createQueryBuilder('ic')
      .select('ic.teaching_group_id', 'group_id')
      .addSelect('ic.create_time', 'invitation_create_time')
      .addSelect('ic.code', 'invitation_code')
      .addSelect('ic.ttl', 'invitation_ttl')
      .where('ic.course_id = :courseId', { courseId })
      .andWhere('ic.type = :type', {
        type: Number(InvitationTypeMap.STUDENT_JOIN_COURSE),
      })
      .andWhere('ic.teaching_group_id IN (:...groupIds)', { groupIds })
      .orderBy('CAST(ic.create_time AS UNSIGNED)', 'DESC')
      .getRawMany<GroupInvitationMetaRowRaw>();

    const result = new Map<
      string,
      {
        invitation_create_time: string | null;
        invitation_code: string | null;
        invitation_ttl: number | null;
      }
    >();

    rows.forEach((row) => {
      const groupId = String(row.group_id || '').trim();
      if (!groupId || result.has(groupId)) {
        return;
      }
      result.set(groupId, {
        invitation_create_time: row.invitation_create_time
          ? String(row.invitation_create_time)
          : null,
        invitation_code: row.invitation_code
          ? String(row.invitation_code)
          : null,
        invitation_ttl:
          row.invitation_ttl === null || row.invitation_ttl === undefined
            ? null
            : Number(row.invitation_ttl),
      });
    });

    return result;
  }

  private normalizeTeacherIds(teacherIds: string[]): string[] {
    const unique = new Set<string>();
    (teacherIds || []).forEach((item) => {
      const value = String(item || '').trim();
      if (value) {
        unique.add(value);
      }
    });
    return Array.from(unique);
  }

  private async syncTeachingGroupTeachers(
    input: SyncTeachingGroupTeachersInput,
  ): Promise<SyncTeachingGroupTeachersResult> {
    const teacherIds = this.normalizeTeacherIds(input.teacherIds);

    return this.dataSource.transaction(async (manager) => {
      const groupTeacherRepository = manager.getRepository(CourseGroupTeacher);

      const currentGroupTeachers = await groupTeacherRepository.find({
        where: { group_id: input.teachingGroupId },
      });
      const currentTeacherIds = new Set(
        currentGroupTeachers.map((item) => item.teacher_id),
      );

      const nextTeacherIds = new Set(teacherIds);
      const toAdd = teacherIds.filter(
        (teacherId) => !currentTeacherIds.has(teacherId),
      );
      const toRemove = Array.from(currentTeacherIds).filter(
        (teacherId) => !nextTeacherIds.has(teacherId),
      );

      if (toAdd.length > 0) {
        const addEntities = toAdd.map((teacherId) =>
          groupTeacherRepository.create({
            group_id: input.teachingGroupId,
            teacher_id: teacherId,
          }),
        );
        await groupTeacherRepository.save(addEntities);
      }

      if (toRemove.length > 0) {
        await groupTeacherRepository.delete({
          group_id: input.teachingGroupId,
          teacher_id: In(toRemove),
        });
      }

      await this.syncCourseTeachersFromGroups(input.courseId, manager);

      return {
        added_count: toAdd.length,
        removed_count: toRemove.length,
        teacher_ids: teacherIds,
      };
    });
  }

  private async syncCourseTeachersFromGroups(
    courseId: string,
    manager: EntityManager,
  ): Promise<void> {
    const groupTeacherRepository = manager.getRepository(CourseGroupTeacher);
    const courseTeacherRepository = manager.getRepository(CourseTeacher);
    const teachingGroupRepository = manager.getRepository(CourseTeachingGroup);

    const courseGroups = await teachingGroupRepository.find({
      select: ['id'],
      where: { course_id: courseId },
    });
    const courseGroupIds = courseGroups.map((item) => item.id);

    const finalCourseTeachers =
      courseGroupIds.length > 0
        ? await groupTeacherRepository.find({
            where: { group_id: In(courseGroupIds) },
          })
        : [];

    const finalCourseTeacherIds = Array.from(
      new Set(finalCourseTeachers.map((item) => item.teacher_id)),
    );
    const existingCourseTeachers = await courseTeacherRepository.find({
      where: { course_id: courseId },
    });
    const existingCourseTeacherIds = new Set(
      existingCourseTeachers.map((item) => item.teacher_id),
    );

    const courseTeacherToAdd = finalCourseTeacherIds.filter(
      (teacherId) => !existingCourseTeacherIds.has(teacherId),
    );
    const courseTeacherToRemove = Array.from(existingCourseTeacherIds).filter(
      (teacherId) => !finalCourseTeacherIds.includes(teacherId),
    );

    if (courseTeacherToAdd.length > 0) {
      const entities = courseTeacherToAdd.map((teacherId) =>
        courseTeacherRepository.create({
          course_id: courseId,
          teacher_id: teacherId,
        }),
      );
      await courseTeacherRepository.save(entities);
    }

    if (courseTeacherToRemove.length > 0) {
      await courseTeacherRepository.delete({
        course_id: courseId,
        teacher_id: In(courseTeacherToRemove),
      });
    }
  }

  async clearStudentCourseData(
    studentId: string,
    courseId: string,
    manager: EntityManager,
  ): Promise<void> {
    const learningRecordRepo = manager.getRepository(CourseLearningRecord);
    const submissionRepo = manager.getRepository(AssignmentSubmission);
    const answerDetailRepo = manager.getRepository(AssignmentAnswerDetail);

    // 1. 删除学习进度
    await learningRecordRepo.delete({
      student_id: studentId,
      course_id: courseId,
    });

    // 2. 删除题目答题详情 (由于可能存在大量记录，根据 student_id 且关联到该课程的题目清理较为复杂，
    // 这里简单处理：删除该学生在该课程下所有提交对应的详情)
    // 先找到该学生在该课程下的所有提交集
    const submissions = await submissionRepo.find({
      select: ['id'],
      where: { student_id: studentId, course_id: courseId },
    });
    const submissionIds = submissions.map((s) => s.id);

    if (submissionIds.length > 0) {
      await answerDetailRepo.delete({ submission_id: In(submissionIds) });
      // 3. 删除作业提交记录
      await submissionRepo.delete({ id: In(submissionIds) });
    }
  }

  async removeTeacherFromCourse(
    teacherId: string,
    courseId: string,
  ): Promise<void> {
    const course = await this.courseRepository.findOne({
      select: ['id', 'creator_id'],
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // 1. 权限校验：创建者不可直接退出
    if (course.creator_id === teacherId) {
      throw new BadRequestException('课程创建者不可退出课程');
    }

    const teachingGroups = await this.courseTeachingGroupRepository.find({
      select: ['id'],
      where: { course_id: courseId },
    });
    const groupIds = teachingGroups.map((g) => g.id);

    if (groupIds.length === 0) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const groupTeacherRepo = manager.getRepository(CourseGroupTeacher);

      // 2. 从教学组中移除教师
      await groupTeacherRepo.delete({
        teacher_id: teacherId,
        group_id: In(groupIds),
      });

      // 3. 同步课程讲师表 (course_teacher)
      await this.syncCourseTeachersFromGroups(courseId, manager);
    });
  }

  private isTempId(id: string): boolean {
    return id.startsWith('temp_');
  }

  private validateDraftAgainstCourse(
    draft: CourseOutlineDraftDto,
    course: Course,
  ): void {
    if (draft.course_id !== course.id) {
      throw new BadRequestException('draft_content.course_id 与课程不匹配');
    }

    if (draft.school_id !== course.school_id) {
      throw new BadRequestException('draft_content.school_id 与课程不匹配');
    }
  }

  private parseDraftContent(
    draftContent: Course['draft_content'],
  ): OutlineDraftRaw | null {
    if (!draftContent) {
      return null;
    }

    if (typeof draftContent === 'string') {
      try {
        const parsed = JSON.parse(draftContent) as OutlineDraftRaw;
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    }

    if (typeof draftContent === 'object') {
      return draftContent as OutlineDraftRaw;
    }

    return null;
  }

  private normalizeOutlineDraft(
    draft: OutlineDraftRaw,
    course: Course,
  ): CourseOutlineDraftDto {
    const chapters = Array.isArray(draft.chapters) ? draft.chapters : [];

    return {
      course_id: this.toStringWithFallback(draft.course_id, course.id),
      school_id: this.toStringWithFallback(draft.school_id, course.school_id),
      status: Number(
        draft.status ?? course.status ?? CourseStatusMap.UNPUBLISHED,
      ),
      chapters: chapters.map((chapterItem) => {
        const chapterObj =
          chapterItem && typeof chapterItem === 'object'
            ? (chapterItem as Record<string, unknown>)
            : {};
        const lessonItems = Array.isArray(chapterObj.lessons)
          ? chapterObj.lessons
          : [];

        return {
          chapter_id: this.toStringWithFallback(chapterObj.chapter_id, ''),
          title: this.toStringWithFallback(chapterObj.title, ''),
          sort_order: Number(chapterObj.sort_order ?? 0),
          lessons: lessonItems.map((lessonItem) => {
            const lessonObj =
              lessonItem && typeof lessonItem === 'object'
                ? (lessonItem as Record<string, unknown>)
                : {};
            return {
              lesson_id: this.toStringWithFallback(lessonObj.lesson_id, ''),
              title: this.toStringWithFallback(lessonObj.title, ''),
              description: this.toStringWithFallback(lessonObj.description, ''),
              sort_order: Number(lessonObj.sort_order ?? 0),
              video_path:
                lessonObj.video_path === null ||
                lessonObj.video_path === undefined ||
                lessonObj.video_path === ''
                  ? null
                  : this.toStringWithFallback(lessonObj.video_path, ''),
              duration: Number(lessonObj.duration ?? 0),
            };
          }),
        };
      }),
    };
  }

  private async buildOutlineFromDatabase(
    course: Course,
  ): Promise<CourseOutlineDraftDto> {
    const chapters = await this.courseChapterRepository.find({
      where: { course_id: course.id },
      order: {
        sort_order: 'ASC',
        create_time: 'ASC',
      },
    });

    const chapterIds = chapters.map((chapter) => chapter.id);
    const lessons =
      chapterIds.length > 0
        ? await this.courseLessonRepository.find({
            where: { chapter_id: In(chapterIds) },
            order: {
              sort_order: 'ASC',
              create_time: 'ASC',
            },
          })
        : [];

    const lessonsMap = new Map<string, CourseLesson[]>();
    lessons.forEach((lesson) => {
      if (!lessonsMap.has(lesson.chapter_id)) {
        lessonsMap.set(lesson.chapter_id, []);
      }
      lessonsMap.get(lesson.chapter_id)?.push(lesson);
    });

    return {
      course_id: course.id,
      school_id: course.school_id,
      status: Number(course.status ?? CourseStatusMap.UNPUBLISHED),
      chapters: chapters.map((chapter) => ({
        chapter_id: chapter.id,
        title: chapter.title,
        sort_order: Number(chapter.sort_order ?? 0),
        lessons: (lessonsMap.get(chapter.id) || []).map((lesson) => ({
          lesson_id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          sort_order: Number(lesson.sort_order ?? 0),
          video_path: lesson.video_path ?? null,
          duration: Number(lesson.duration ?? 0),
        })),
      })),
    };
  }

  private toStringWithFallback(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return fallback;
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

  private async findTeachingGroupWithPermissionOrThrow(
    id: string,
    user: User,
  ): Promise<{ course: Course; teachingGroup: CourseTeachingGroup }> {
    const teachingGroup = await this.courseTeachingGroupRepository.findOneBy({
      id,
    });
    if (!teachingGroup) {
      throw new NotFoundException('教学组不存在');
    }

    const course = await this.findCourseWithPermissionOrThrow(
      teachingGroup.course_id,
      user,
    );

    return {
      course,
      teachingGroup,
    };
  }

  private async findCourseWithTeacherPermissionOrThrow(
    courseId: string,
    userId: string,
  ): Promise<Course> {
    const teacher = await this.teacherRepository.findOne({
      where: { user_id: userId },
    });
    if (!teacher) {
      throw new ForbiddenException('仅教师可操作');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    if (course.creator_id !== teacher.id) {
      throw new ForbiddenException('仅课程创建者可操作教学组');
    }

    return course;
  }

  private async findTeachingGroupWithTeacherPermissionOrThrow(
    groupId: string,
    userId: string,
  ): Promise<{ course: Course; teachingGroup: CourseTeachingGroup }> {
    const teachingGroup = await this.courseTeachingGroupRepository.findOne({
      where: { id: groupId },
    });
    if (!teachingGroup) {
      throw new NotFoundException('教学组不存在');
    }

    const course = await this.findCourseWithTeacherPermissionOrThrow(
      teachingGroup.course_id,
      userId,
    );

    return { course, teachingGroup };
  }

  async syncLearningProgress(dto: SyncProgressDto): Promise<any> {
    const userId = this.alsService.getUserId();
    const studentId = this.alsService.getActorId();
    const schoolId = this.alsService.getSchoolId();

    if (!userId || !studentId || !schoolId) {
      throw new ForbiddenException('应用上下文缺失，请重新登录选校');
    }
    const { courseId, chapterId, lessonId, progress_percent } = dto;

    const existingRecord = await this.courseLearningRecordRepository.findOne({
      where: {
        student_id: studentId,
        course_id: courseId,
        chapter_id: chapterId,
        lesson_id: lessonId,
      },
    });

    const now = String(Math.floor(Date.now() / 1000));

    if (existingRecord) {
      existingRecord.progress_percent = Math.max(
        existingRecord.progress_percent || 0,
        progress_percent,
      );
      existingRecord.last_learn_time = now;
      if (
        progress_percent >= 90 &&
        existingRecord.is_completed === BinaryFlagMap.NO
      ) {
        existingRecord.is_completed = BinaryFlagMap.YES;
        existingRecord.learn_count = (existingRecord.learn_count || 0) + 1;
      }
      await this.courseLearningRecordRepository.save(existingRecord);
      return {
        chapter_id: existingRecord.chapter_id,
        lesson_id: existingRecord.lesson_id,
        progress_percent: existingRecord.progress_percent,
        learn_count: existingRecord.learn_count,
        is_completed: existingRecord.is_completed,
        last_learn_time: existingRecord.last_learn_time,
      };
    } else {
      const is_completed =
        progress_percent >= 90 ? BinaryFlagMap.YES : BinaryFlagMap.NO;
      const learn_count = is_completed === BinaryFlagMap.YES ? 1 : 0;
      const newRecord = this.courseLearningRecordRepository.create({
        student_id: studentId,
        course_id: courseId,
        chapter_id: chapterId,
        lesson_id: lessonId,
        progress_percent,
        learn_count,
        is_completed,
        last_learn_time: now,
      });
      await this.courseLearningRecordRepository.save(newRecord);
      return {
        chapter_id: newRecord.chapter_id,
        lesson_id: newRecord.lesson_id,
        progress_percent: newRecord.progress_percent,
        learn_count: newRecord.learn_count,
        is_completed: newRecord.is_completed,
        last_learn_time: newRecord.last_learn_time,
      };
    }
  }

  async getCourseLearningProgress(
    dto: GetCourseLearningProgressDto,
  ): Promise<CourseLearningProgressResponseDto> {
    const userId = this.alsService.getUserId();
    const studentId = this.alsService.getActorId();
    const schoolId = this.alsService.getSchoolId();

    if (!userId || !studentId || !schoolId) {
      throw new ForbiddenException('应用上下文缺失，请重新登录选校');
    }
    const { courseId } = dto;

    // 1. 获取课程所有章节和课时
    const chapters = await this.courseChapterRepository.find({
      where: { course_id: courseId },
      order: { sort_order: 'ASC' },
    });

    if (chapters.length === 0) {
      return {
        total_lessons: 0,
        total_completed: 0,
        chapter_progress: [],
      };
    }

    const chapterIds = chapters.map((c) => c.id);
    const lessons = await this.courseLessonRepository.find({
      where: { chapter_id: In(chapterIds) },
      order: { sort_order: 'ASC' },
    });

    // 2. 获取该学生的学习记录
    const records = await this.courseLearningRecordRepository.find({
      where: {
        student_id: studentId,
        course_id: courseId,
      },
    });

    const recordMap = new Map<string, CourseLearningRecord>();
    records.forEach((r) => recordMap.set(r.lesson_id, r));

    // 3. 统计数据
    let totalCompleted = 0;
    const chapterProgress: ChapterProgressDto[] = chapters.map((chapter) => {
      const chapterLessons = lessons.filter((l) => l.chapter_id === chapter.id);

      const lessonProgressList: LessonProgressDto[] = chapterLessons.map(
        (lesson) => {
          const record = recordMap.get(lesson.id);
          return {
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            progress_percent: record?.progress_percent ?? 0,
            learn_count: record?.learn_count ?? 0,
            is_completed: record?.is_completed ?? BinaryFlagMap.NO,
            last_learn_time: record?.last_learn_time ?? null,
          };
        },
      );

      const completedInChapter = lessonProgressList.filter(
        (lp) => lp.is_completed === BinaryFlagMap.YES,
      ).length;

      totalCompleted += completedInChapter;

      return {
        chapter_id: chapter.id,
        chapter_title: chapter.title,
        total_lessons: chapterLessons.length,
        completed_lessons: completedInChapter,
        lessons: lessonProgressList,
      };
    });

    return {
      total_lessons: lessons.length,
      total_completed: totalCompleted,
      chapter_progress: chapterProgress,
    };
  }
}
