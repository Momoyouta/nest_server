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
import { User } from '@/database/entities/user.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
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
} from '@/modules/course/dto/CourseAdmin.dto';
import { CourseStatusMap } from '@/common/utils/course.map';
import { PlatformAdminRoles, SchoolAdminRoles } from '@/common/utils/role.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { StorageService } from '../file/storage/storage.service';
import {
  CourseOutlineSource,
  CourseOutlineSourceMap,
} from '@/common/utils/course-outline.map';
import { InvitationTypeMap } from '@/common/utils/invite-type.map';

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

    const saved = await this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const teachingGroupRepository =
        manager.getRepository(CourseTeachingGroup);

      const course = courseRepository.create({
        school_id: schoolId,
        creator_id: user.id,
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

    const teacherNamesMap = await this.getTeachingGroupTeacherNamesMap(
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
        teachers: teacherNamesMap.get(item.id) || [],
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
    const teacherNamesMap = await this.getTeachingGroupTeacherNamesMap([
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
      teachers: teacherNamesMap.get(teachingGroup.id) || [],
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
      await teachingGroupRepository.delete({ id: teachingGroup.id });
      await this.syncCourseTeachersFromGroups(course.id, manager);
    });

    return {
      id,
      deleted: true,
    };
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

  async saveCourseDraftAdmin(
    payload: SaveCourseDraftDto,
  ): Promise<SaveCourseDraftResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const course = await this.findCourseWithPermissionOrThrow(
      payload.course_id,
      user,
    );
    this.validateDraftAgainstCourse(payload.draft_content, course);

    course.draft_content = payload.draft_content as unknown as Record<
      string,
      unknown
    >;
    await this.courseRepository.save(course);

    return {
      course_id: course.id,
      updated: true,
    };
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

    return this.dataSource.transaction(async (manager) => {
      const courseRepository = manager.getRepository(Course);
      const chapterRepository = manager.getRepository(CourseChapter);
      const lessonRepository = manager.getRepository(CourseLesson);

      const courseEntity = await courseRepository.findOneBy({ id: course.id });
      if (!courseEntity) {
        throw new NotFoundException('课程不存在');
      }

      // 先落草稿，再执行后续发布差异同步（同事务，失败会整体回滚）
      courseEntity.draft_content = payload.draft_content as unknown as Record<
        string,
        unknown
      >;
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

      for (const chapterItem of payload.draft_content.chapters || []) {
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

      for (const chapterItem of payload.draft_content.chapters || []) {
        const chapterId = String(chapterItem.chapter_id);
        const realChapterId = chapterIdMap.get(chapterId);
        if (!realChapterId) {
          throw new BadRequestException(`章节ID映射不存在: ${chapterId}`);
        }

        for (const lessonItem of chapterItem.lessons || []) {
          const lessonId = String(lessonItem.lesson_id);
          if (this.isTempId(lessonId)) {
            const createdLesson: CourseLesson = lessonRepository.create({
              chapter_id: realChapterId,
              title: lessonItem.title,
              description: lessonItem.description || '',
              resource_id: lessonItem.resource_id ?? null,
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
            lesson.resource_id = lessonItem.resource_id ?? null;
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

    const chapter = await this.courseChapterRepository.findOne({
      where: {
        id: payload.chapter.chapter_id,
        course_id: course.id,
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }

    course.draft_content = payload.draft_content as unknown as Record<
      string,
      unknown
    >;
    await this.courseRepository.save(course);

    chapter.title = payload.chapter.title;
    await this.courseChapterRepository.save(chapter);

    return {
      course_id: course.id,
      chapter_id: chapter.id,
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

    const chapter = await this.courseChapterRepository.findOne({
      where: {
        id: payload.lesson.chapter_id,
        course_id: course.id,
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }

    const lesson = await this.courseLessonRepository
      .createQueryBuilder('lesson')
      .innerJoin(CourseChapter, 'chapter', 'chapter.id = lesson.chapter_id')
      .where('lesson.id = :lessonId', { lessonId: payload.lesson.lesson_id })
      .andWhere('chapter.course_id = :courseId', { courseId: course.id })
      .getOne();

    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }

    course.draft_content = payload.draft_content as unknown as Record<
      string,
      unknown
    >;
    await this.courseRepository.save(course);

    lesson.chapter_id = chapter.id;
    lesson.title = payload.lesson.title;
    lesson.description = payload.lesson.description || '';
    lesson.resource_id = payload.lesson.resource_id ?? null;
    lesson.duration = Number(payload.lesson.duration ?? 0);
    lesson.sort_order = Number(payload.lesson.sort_order ?? 0);

    await this.courseLessonRepository.save(lesson);

    return {
      course_id: course.id,
      lesson_id: lesson.id,
      updated: true,
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

  async getCourseLessonOutline(
    id: string,
    source?: string,
  ): Promise<CourseOutlineDraftDto> {
    const course = await this.courseRepository.findOneBy({ id });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const platform = this.alsService.getStore()?.platform;
    const adminSource: CourseOutlineSource =
      source === CourseOutlineSourceMap.PUBLISHED
        ? CourseOutlineSourceMap.PUBLISHED
        : CourseOutlineSourceMap.DRAFT;

    if (
      platform === 'admin' &&
      adminSource !== CourseOutlineSourceMap.PUBLISHED
    ) {
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

  private async getTeachingGroupTeacherNamesMap(
    groupIds: string[],
  ): Promise<Map<string, string[]>> {
    if (groupIds.length === 0) {
      return new Map();
    }

    const rows = await this.courseGroupTeacherRepository
      .createQueryBuilder('cgt')
      .innerJoin(Teacher, 'teacher', 'teacher.id = cgt.teacher_id')
      .innerJoin(User, 'user', 'user.id = teacher.user_id')
      .select('cgt.group_id', 'group_id')
      .addSelect('user.name', 'teacher_name')
      .where('cgt.group_id IN (:...groupIds)', { groupIds })
      .getRawMany<GroupTeacherNameRowRaw>();

    const nameSetMap = new Map<string, Set<string>>();
    rows.forEach((item) => {
      const groupId = String(item.group_id || '').trim();
      const teacherName = String(item.teacher_name || '').trim();
      if (!groupId || !teacherName) {
        return;
      }
      if (!nameSetMap.has(groupId)) {
        nameSetMap.set(groupId, new Set<string>());
      }
      nameSetMap.get(groupId)?.add(teacherName);
    });

    const result = new Map<string, string[]>();
    nameSetMap.forEach((value, key) => {
      result.set(key, Array.from(value));
    });
    return result;
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
              resource_id:
                lessonObj.resource_id === null ||
                lessonObj.resource_id === undefined ||
                lessonObj.resource_id === ''
                  ? null
                  : this.toStringWithFallback(lessonObj.resource_id, ''),
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
          resource_id: lesson.resource_id ?? null,
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
}
