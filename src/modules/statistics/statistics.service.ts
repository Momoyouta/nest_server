import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { DataSource, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { AdminRolesMap } from '@/common/utils/role.map';
import { SchoolApplication } from '@/database/entities/school_application.entity';
import { School } from '@/database/entities/school.entity';
import { UserSchoolIdentity } from '@/database/entities/user_school_identity.entity';
import { Course } from '@/database/entities/course.entity';
import { FileChunk } from '@/modules/file/chunk/chunk.entity';
import { CourseMaterial } from '@/database/entities/course_material.entity';
import { CourseTeachingGroup } from '@/database/entities/course_teaching_group.entity';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { CourseLearningRecord } from '@/database/entities/course_learning_record.entity';
import { CourseAssignment } from '@/database/entities/course_assignment.entity';
import { AssignmentSubmission } from '@/database/entities/assignment_submission.entity';
import { AssignmentAnswerDetail } from '@/database/entities/assignment_answer_detail.entity';
import { CourseAssignmentQuestion } from '@/database/entities/course_assignment_question.entity';
import { CourseLesson } from '@/database/entities/course_lesson.entity';
import { CourseTeacher } from '@/database/entities/course_teacher.entity';
import { Student } from '@/database/entities/student.entity';
import { User } from '@/database/entities/user.entity';
import { SchoolApplicationStatusMap } from '@/common/utils/school-application.map';
import { FileChunkStatusMap, FileChunkTypeMap } from '@/common/utils/file-chunk-admin.map';
import {
  AssignmentSubmissionStatusMap,
  CourseAssignmentQuestionTypeMap,
  CourseAssignmentStatusMap,
  CourseStatusMap,
} from '@/common/utils/course.map';
import { ScoreBucketMap } from '@/common/utils/score-bucket.map';
import {
  TeacherCourseProgressCompletedOnlyMap,
  TeacherCourseProgressSortByMap,
  TeacherCourseProgressSortColumnMap,
  TeacherCourseProgressSortOrderMap,
} from '@/common/utils/teacher-course-progress.map';
import {
  TeacherQuestionMetricSortByMap,
  TeacherQuestionMetricSortColumnMap,
  TeacherQuestionMetricSortOrderMap,
} from '@/common/utils/teacher-question-statistics.map';
import {
  StatisticsMetricMap,
  StatisticsScope,
} from '@/common/utils/statistics-metric.map';
import {
  AssetSummaryDto,
  ContinueLearningDto,
  CourseSummaryDto,
  GradeHistoryItemDto,
  LearningSummaryDto,
  LessonFunnelItemDto,
  PeopleSummaryDto,
  PlatformSchoolTotalDto,
  PlatformUserTotalDto,
  PlatformOverviewDto,
  QuestionAccuracyItemDto,
  SchoolFunnelDto,
  SchoolOverviewDto,
  ScoreDistributionDto,
  StudentCourseGroupLearningSummaryDto,
  TeacherCourseGroupProgressDto,
  TeacherDashboardDto,
  TeacherFillQuestionScoreRatePageDto,
  TeacherObjectiveQuestionAccuracyPageDto,
  TeacherShortAnswerQuestionScoreRatePageDto,
  TeacherTodoDto,
  TodoAssignmentItemDto,
  StudentCourseProgressItemDto,
  StudentLearningCenterDto,
  StatisticsDictionaryDto,
  StorageUsageDto,
  SubmissionStatusDto,
} from '@/modules/statistics/dto/statistics-response.dto';
import {
  PlatformOverviewQueryDto,
  SchoolOverviewQueryDto,
  StatisticsDictionaryQueryDto,
  StatisticsTimeRangeQueryDto,
  StudentCourseGroupLearningSummaryQueryDto,
  StudentLearningCenterQueryDto,
  TeacherCourseGroupProgressQueryDto,
  TeacherDashboardQueryDto,
  TeacherQuestionMetricQueryDto,
} from '@/modules/statistics/dto/statistics-query.dto';
import { buildStatisticsCacheKey } from '@/modules/statistics/utils/statistics-cache-key.util';

interface TimeRange {
  startTime?: number;
  endTime?: number;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(SchoolApplication)
    private readonly schoolApplicationRepo: Repository<SchoolApplication>,
    @InjectRepository(School)
    private readonly schoolRepo: Repository<School>,
    @InjectRepository(UserSchoolIdentity)
    private readonly userSchoolIdentityRepo: Repository<UserSchoolIdentity>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(FileChunk)
    private readonly fileChunkRepo: Repository<FileChunk>,
    @InjectRepository(CourseMaterial)
    private readonly courseMaterialRepo: Repository<CourseMaterial>,
    @InjectRepository(CourseTeachingGroup)
    private readonly courseTeachingGroupRepo: Repository<CourseTeachingGroup>,
    @InjectRepository(CourseStudent)
    private readonly courseStudentRepo: Repository<CourseStudent>,
    @InjectRepository(CourseLearningRecord)
    private readonly learningRecordRepo: Repository<CourseLearningRecord>,
    @InjectRepository(CourseAssignment)
    private readonly courseAssignmentRepo: Repository<CourseAssignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(AssignmentAnswerDetail)
    private readonly assignmentAnswerDetailRepo: Repository<AssignmentAnswerDetail>,
    @InjectRepository(CourseAssignmentQuestion)
    private readonly courseAssignmentQuestionRepo: Repository<CourseAssignmentQuestion>,
    @InjectRepository(CourseLesson)
    private readonly courseLessonRepo: Repository<CourseLesson>,
    @InjectRepository(CourseTeacher)
    private readonly courseTeacherRepo: Repository<CourseTeacher>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly alsService: AsyncLocalstorageService,
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return parsed;
  }

  private toFixedNumber(value: number, digits = 4): number {
    return Number(value.toFixed(digits));
  }

  private parseTimeRange(query: StatisticsTimeRangeQueryDto): TimeRange {
    const range: TimeRange = {};
    if (query.startTime !== undefined) {
      const startTime = Number(query.startTime);
      if (!Number.isFinite(startTime) || startTime < 0) {
        throw new BadRequestException('startTime 非法');
      }
      range.startTime = startTime;
    }
    if (query.endTime !== undefined) {
      const endTime = Number(query.endTime);
      if (!Number.isFinite(endTime) || endTime < 0) {
        throw new BadRequestException('endTime 非法');
      }
      range.endTime = endTime;
    }
    if (
      range.startTime !== undefined &&
      range.endTime !== undefined &&
      range.startTime > range.endTime
    ) {
      throw new BadRequestException('startTime 不能大于 endTime');
    }
    return range;
  }

  private applyStringTimestampRange<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    column: string,
    range: TimeRange,
  ) {
    if (range.startTime !== undefined) {
      qb.andWhere(`CAST(${column} AS UNSIGNED) >= :startTime`, {
        startTime: range.startTime,
      });
    }
    if (range.endTime !== undefined) {
      qb.andWhere(`CAST(${column} AS UNSIGNED) <= :endTime`, {
        endTime: range.endTime,
      });
    }
  }

  private applyDatetimeRange<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    column: string,
    range: TimeRange,
  ) {
    if (range.startTime !== undefined) {
      qb.andWhere(`UNIX_TIMESTAMP(${column}) >= :startTime`, {
        startTime: range.startTime,
      });
    }
    if (range.endTime !== undefined) {
      qb.andWhere(`UNIX_TIMESTAMP(${column}) <= :endTime`, {
        endTime: range.endTime,
      });
    }
  }

  private getRoleIds(): string[] {
    return this.alsService.getStore()?.roleIds ?? [];
  }

  private isPlatformAdmin(roleIds: string[]): boolean {
    return roleIds.some((roleId) =>
      [
        AdminRolesMap.root,
        AdminRolesMap.admin,
        'root',
        'admin',
      ].includes(roleId),
    );
  }

  private async withCache<T>(
    cacheKey: string,
    ttl: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // 缓存不可用时降级为直查数据库
    }

    const loaded = await loader();
    try {
      await this.redisClient.set(cacheKey, JSON.stringify(loaded), 'EX', ttl);
    } catch {
      // 忽略缓存写入错误
    }
    return loaded;
  }

  private async resolveSchoolId(requestSchoolId?: string): Promise<string> {
    const schoolIdInContext = this.alsService.getSchoolId();
    const roleIds = this.getRoleIds();
    const isPlatformAdmin = this.isPlatformAdmin(roleIds);

    if (requestSchoolId && isPlatformAdmin) {
      return requestSchoolId;
    }

    if (requestSchoolId && !isPlatformAdmin) {
      if (schoolIdInContext && schoolIdInContext !== requestSchoolId) {
        throw new ForbiddenException('无权访问其他学校统计数据');
      }
      return requestSchoolId;
    }

    if (schoolIdInContext) {
      return schoolIdInContext;
    }

    throw new BadRequestException('schoolId 不能为空');
  }

  private async getTeacherActorIdOrThrow(userId: string): Promise<string> {
    const schoolId = this.alsService.getSchoolId();
    if (!schoolId) {
      throw new ForbiddenException('未选择学校');
    }
    const identity = await this.userSchoolIdentityRepo.findOne({
      where: { user_id: userId, school_id: schoolId, actor_type: 1, status: 1 },
    });
    if (!identity) {
      throw new ForbiddenException('当前用户在该学校没有教师身份');
    }
    return identity.actor_id;
  }

  private async getStudentActorIdOrThrow(userId: string): Promise<string> {
    const schoolId = this.alsService.getSchoolId();
    if (!schoolId) {
      throw new ForbiddenException('未选择学校');
    }
    const identity = await this.userSchoolIdentityRepo.findOne({
      where: { user_id: userId, school_id: schoolId, actor_type: 2, status: 1 },
    });
    if (!identity) {
      throw new ForbiddenException('当前用户在该学校没有学生身份');
    }
    return identity.actor_id;
  }

  private async resolveTeacherCourseIds(
    teacherId: string,
    courseId?: string,
  ): Promise<string[]> {
    if (courseId) {
      return [courseId];
    }
    const linkedRows = await this.courseTeacherRepo.find({
      select: ['course_id'],
      where: { teacher_id: teacherId },
    });
    const linkedCourseIds = linkedRows.map((row) => row.course_id);
    if (linkedCourseIds.length > 0) {
      return linkedCourseIds;
    }
    const createdRows = await this.courseRepo.find({
      select: ['id'],
      where: { creator_id: teacherId },
    });
    return createdRows.map((row) => row.id);
  }

  private async assertTeacherCourseAccess(teacherId: string, courseId: string) {
    const linkedCount = await this.courseTeacherRepo.count({
      where: { teacher_id: teacherId, course_id: courseId },
    });
    if (linkedCount > 0) {
      return;
    }

    const creatorCount = await this.courseRepo.count({
      where: { id: courseId, creator_id: teacherId },
    });
    if (creatorCount > 0) {
      return;
    }

    throw new ForbiddenException('无权访问该课程数据');
  }

  private async assertTeachingGroupBelongsCourse(
    courseId: string,
    teachingGroupId: string,
  ) {
    const group = await this.courseTeachingGroupRepo.findOne({
      where: { id: teachingGroupId, course_id: courseId },
    });
    if (!group) {
      throw new NotFoundException('教学组不存在或不属于当前课程');
    }
  }

  private buildEmptySubmissionStatus(): SubmissionStatusDto {
    return {
      unsubmitted: [],
      submittedPendingReview: [],
      reviewed: [],
    };
  }

  async getPlatformSchoolFunnel(
    query: PlatformOverviewQueryDto,
  ): Promise<SchoolFunnelDto> {
    const data = await this.buildPlatformSnapshot(query);
    return data.schoolFunnel;
  }

  async getPlatformSchoolTotal(
    query: PlatformOverviewQueryDto,
  ): Promise<PlatformSchoolTotalDto> {
    const data = await this.buildPlatformSnapshot(query);
    return { schoolTotal: data.schoolTotal };
  }

  async getPlatformUserTotal(
    query: PlatformOverviewQueryDto,
  ): Promise<PlatformUserTotalDto> {
    const data = await this.buildPlatformSnapshot(query);
    return data.userTotal;
  }

  async getPlatformStorageUsage(
    query: PlatformOverviewQueryDto,
  ): Promise<StorageUsageDto> {
    const data = await this.buildPlatformSnapshot(query);
    return data.storageUsage;
  }

  async getPlatformCourseSummary(
    query: PlatformOverviewQueryDto,
  ): Promise<CourseSummaryDto> {
    const data = await this.buildPlatformSnapshot(query);
    return data.courseSummary;
  }

  private async buildPlatformSnapshot(
    query: PlatformOverviewQueryDto,
  ): Promise<PlatformOverviewDto> {
    const range = this.parseTimeRange(query);
    const cacheKey = buildStatisticsCacheKey({
      scope: 'platform',
      role: 'admin',
      tenantId: 'platform',
      metricSet: 'platform-snapshot',
      startTime: range.startTime,
      endTime: range.endTime,
    });

    return this.withCache(cacheKey, 180, async () => {
      const funnelQb = this.schoolApplicationRepo
        .createQueryBuilder('sa')
        .select('COUNT(1)', 'totalApply')
        .addSelect(
          'SUM(CASE WHEN sa.status = :approvedStatus THEN 1 ELSE 0 END)',
          'approved',
        )
        .addSelect(
          'SUM(CASE WHEN sa.status = :rejectedStatus THEN 1 ELSE 0 END)',
          'rejected',
        )
        .setParameters({
          approvedStatus: SchoolApplicationStatusMap.APPROVED,
          rejectedStatus: SchoolApplicationStatusMap.REJECTED,
        });
      this.applyDatetimeRange(funnelQb, 'sa.created_at', range);
      const funnelRaw = await funnelQb.getRawOne<{
        totalApply: string;
        approved: string;
        rejected: string;
      }>();

      const schoolTotal = await this.schoolRepo.count({ where: { status: 1 } });

      const userRaw = await this.userSchoolIdentityRepo
        .createQueryBuilder('usi')
        .select('COUNT(DISTINCT usi.user_id)', 'total')
        .addSelect(
          'COUNT(DISTINCT CASE WHEN usi.actor_type = :teacherType THEN usi.user_id END)',
          'teacherTotal',
        )
        .addSelect(
          'COUNT(DISTINCT CASE WHEN usi.actor_type = :studentType THEN usi.user_id END)',
          'studentTotal',
        )
        .where('usi.status = :activeStatus', { activeStatus: 1 })
        .setParameters({ teacherType: 1, studentType: 2 })
        .getRawOne<{
          total: string;
          teacherTotal: string;
          studentTotal: string;
        }>();

      const storageQb = this.fileChunkRepo
        .createQueryBuilder('fc')
        .select('COALESCE(SUM(fc.file_size), 0)', 'totalBytes')
        .addSelect(
          'COALESCE(SUM(CASE WHEN fc.type = :videoType THEN fc.file_size ELSE 0 END), 0)',
          'videoBytes',
        )
        .addSelect(
          'COALESCE(SUM(CASE WHEN fc.type <> :videoType OR fc.type IS NULL THEN fc.file_size ELSE 0 END), 0)',
          'normalBytes',
        )
        .where('fc.status = :doneStatus', { doneStatus: FileChunkStatusMap.done })
        .setParameters({ videoType: FileChunkTypeMap.VIDEO });
      this.applyDatetimeRange(storageQb, 'fc.create_time', range);
      const storageRaw = await storageQb.getRawOne<{
        totalBytes: string;
        videoBytes: string;
        normalBytes: string;
      }>();

      const courseQb = this.courseRepo
        .createQueryBuilder('c')
        .select('COUNT(1)', 'totalCourses')
        .addSelect(
          'SUM(CASE WHEN c.status = :published THEN 1 ELSE 0 END)',
          'publishedCourses',
        )
        .setParameter('published', CourseStatusMap.PUBLISHED);
      this.applyStringTimestampRange(courseQb, 'c.create_time', range);
      const courseRaw = await courseQb.getRawOne<{
        totalCourses: string;
        publishedCourses: string;
      }>();

      const totalBytes = this.toNumber(storageRaw?.totalBytes);
      const videoBytes = this.toNumber(storageRaw?.videoBytes);
      const totalCourses = this.toNumber(courseRaw?.totalCourses);
      const publishedCourses = this.toNumber(courseRaw?.publishedCourses);

      return {
        schoolFunnel: {
          totalApply: this.toNumber(funnelRaw?.totalApply),
          approved: this.toNumber(funnelRaw?.approved),
          rejected: this.toNumber(funnelRaw?.rejected),
        },
        schoolTotal,
        userTotal: {
          total: this.toNumber(userRaw?.total),
          teacherTotal: this.toNumber(userRaw?.teacherTotal),
          studentTotal: this.toNumber(userRaw?.studentTotal),
        },
        storageUsage: {
          totalBytes,
          videoBytes,
          normalBytes: this.toNumber(storageRaw?.normalBytes),
          videoRatio:
            totalBytes > 0 ? this.toFixedNumber(videoBytes / totalBytes) : 0,
        },
        courseSummary: {
          totalCourses,
          publishedCourses,
          publishedRatio:
            totalCourses > 0
              ? this.toFixedNumber(publishedCourses / totalCourses)
              : 0,
        },
      };
    });
  }

  async getSchoolPeopleSummary(
    query: SchoolOverviewQueryDto,
  ): Promise<PeopleSummaryDto> {
    const data = await this.buildSchoolSnapshot(query);
    return data.peopleSummary;
  }

  async getSchoolCourseSummary(
    query: SchoolOverviewQueryDto,
  ): Promise<CourseSummaryDto> {
    const data = await this.buildSchoolSnapshot(query);
    return data.courseSummary;
  }

  async getSchoolAssetSummary(
    query: SchoolOverviewQueryDto,
  ): Promise<AssetSummaryDto> {
    const data = await this.buildSchoolSnapshot(query);
    return data.assetSummary;
  }

  async getSchoolLearningSummary(
    query: SchoolOverviewQueryDto,
  ): Promise<LearningSummaryDto> {
    const data = await this.buildSchoolSnapshot(query);
    return data.learningSummary;
  }

  private async buildSchoolSnapshot(
    query: SchoolOverviewQueryDto,
  ): Promise<SchoolOverviewDto> {
    const range = this.parseTimeRange(query);
    const schoolId = await this.resolveSchoolId(query.schoolId);
    const cacheKey = buildStatisticsCacheKey({
      scope: 'school',
      role: 'admin',
      tenantId: schoolId,
      metricSet: 'school-snapshot',
      startTime: range.startTime,
      endTime: range.endTime,
    });

    return this.withCache(cacheKey, 180, async () => {
      const [teacherRaw, studentRaw] = await Promise.all([
        this.userSchoolIdentityRepo
          .createQueryBuilder('usi')
          .select('COUNT(DISTINCT usi.actor_id)', 'count')
          .where('usi.school_id = :schoolId', { schoolId })
          .andWhere('usi.actor_type = :teacherType', { teacherType: 1 })
          .andWhere('usi.status = :activeStatus', { activeStatus: 1 })
          .getRawOne<{ count: string }>(),
        this.userSchoolIdentityRepo
          .createQueryBuilder('usi')
          .select('COUNT(DISTINCT usi.actor_id)', 'count')
          .where('usi.school_id = :schoolId', { schoolId })
          .andWhere('usi.actor_type = :studentType', { studentType: 2 })
          .andWhere('usi.status = :activeStatus', { activeStatus: 1 })
          .getRawOne<{ count: string }>(),
      ]);

      const collegeRows = await this.dataSource.query(
        `
          SELECT
            t.college AS college,
            SUM(t.teacherCount) AS teacherCount,
            SUM(t.studentCount) AS studentCount
          FROM (
            SELECT
              COALESCE(teacher.college, '未分配') AS college,
              COUNT(DISTINCT usi.actor_id) AS teacherCount,
              0 AS studentCount
            FROM user_school_identity usi
            INNER JOIN teacher ON teacher.id = usi.actor_id
            WHERE usi.school_id = ? AND usi.actor_type = 1 AND usi.status = 1
            GROUP BY COALESCE(teacher.college, '未分配')

            UNION ALL

            SELECT
              COALESCE(student.college, '未分配') AS college,
              0 AS teacherCount,
              COUNT(DISTINCT usi.actor_id) AS studentCount
            FROM user_school_identity usi
            INNER JOIN student ON student.id = usi.actor_id
            WHERE usi.school_id = ? AND usi.actor_type = 2 AND usi.status = 1
            GROUP BY COALESCE(student.college, '未分配')
          ) t
          GROUP BY t.college
          ORDER BY (SUM(t.teacherCount) + SUM(t.studentCount)) DESC
        `,
        [schoolId, schoolId],
      );

      const courseQb = this.courseRepo
        .createQueryBuilder('course')
        .select('COUNT(1)', 'totalCourses')
        .addSelect(
          'SUM(CASE WHEN course.status = :publishedStatus THEN 1 ELSE 0 END)',
          'publishedCourses',
        )
        .where('course.school_id = :schoolId', { schoolId })
        .setParameter('publishedStatus', CourseStatusMap.PUBLISHED);
      this.applyStringTimestampRange(courseQb, 'course.create_time', range);
      const courseRaw = await courseQb.getRawOne<{
        totalCourses: string;
        publishedCourses: string;
      }>();

      const materialQb = this.courseMaterialRepo
        .createQueryBuilder('material')
        .innerJoin(Course, 'course', 'course.id = material.course_id')
        .select('COUNT(DISTINCT material.file_id)', 'materialLibraryCount')
        .where('course.school_id = :schoolId', { schoolId });
      this.applyStringTimestampRange(materialQb, 'material.create_time', range);
      const materialRaw = await materialQb.getRawOne<{
        materialLibraryCount: string;
      }>();

      const groupQb = this.courseTeachingGroupRepo
        .createQueryBuilder('group')
        .innerJoin(Course, 'course', 'course.id = group.course_id')
        .select('COUNT(DISTINCT group.id)', 'activeTeachingGroups')
        .where('course.school_id = :schoolId', { schoolId });
      this.applyStringTimestampRange(groupQb, 'group.create_time', range);
      const groupRaw = await groupQb.getRawOne<{ activeTeachingGroups: string }>();

      const progressQb = this.courseStudentRepo
        .createQueryBuilder('cs')
        .innerJoin(Course, 'course', 'course.id = cs.course_id')
        .select('ROUND(AVG(COALESCE(cs.progress_percent, 0)), 2)', 'avgProgressPercent')
        .where('course.school_id = :schoolId', { schoolId });
      this.applyStringTimestampRange(progressQb, 'cs.create_time', range);
      const progressRaw = await progressQb.getRawOne<{ avgProgressPercent: string }>();

      const submitQb = this.assignmentSubmissionRepo
        .createQueryBuilder('submission')
        .innerJoin(Course, 'course', 'course.id = submission.course_id')
        .select(
          'SUM(CASE WHEN submission.status IN (:...submittedStatus) THEN 1 ELSE 0 END)',
          'submittedCount',
        )
        .addSelect('COUNT(1)', 'totalCount')
        .addSelect(
          'AVG(CASE WHEN submission.status = :reviewedStatus THEN CAST(submission.total_score AS DECIMAL(10,2)) END)',
          'avgReviewedScore',
        )
        .where('course.school_id = :schoolId', { schoolId })
        .setParameters({
          submittedStatus: [
            AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW,
            AssignmentSubmissionStatusMap.REVIEWED,
          ],
          reviewedStatus: AssignmentSubmissionStatusMap.REVIEWED,
        });
      this.applyStringTimestampRange(submitQb, 'submission.create_time', range);
      const submitRaw = await submitQb.getRawOne<{
        submittedCount: string;
        totalCount: string;
        avgReviewedScore: string;
      }>();

      const totalCourses = this.toNumber(courseRaw?.totalCourses);
      const publishedCourses = this.toNumber(courseRaw?.publishedCourses);
      const totalCount = this.toNumber(submitRaw?.totalCount);
      const submittedCount = this.toNumber(submitRaw?.submittedCount);
      const avgReviewedScore = this.toNumber(submitRaw?.avgReviewedScore);

      return {
        peopleSummary: {
          activeTeachers: this.toNumber(teacherRaw?.count),
          activeStudents: this.toNumber(studentRaw?.count),
          collegeDistribution: (collegeRows as Array<Record<string, unknown>>).map(
            (item) => ({
              college: String(item.college ?? '未分配'),
              teacherCount: this.toNumber(item.teacherCount),
              studentCount: this.toNumber(item.studentCount),
            }),
          ),
        },
        courseSummary: {
          totalCourses,
          publishedCourses,
          publishedRatio:
            totalCourses > 0
              ? this.toFixedNumber(publishedCourses / totalCourses)
              : 0,
        },
        assetSummary: {
          materialLibraryCount: this.toNumber(materialRaw?.materialLibraryCount),
          activeTeachingGroups: this.toNumber(groupRaw?.activeTeachingGroups),
        },
        learningSummary: {
          avgProgressPercent: this.toNumber(progressRaw?.avgProgressPercent),
          assignmentSubmitRate:
            totalCount > 0 ? this.toFixedNumber(submittedCount / totalCount) : 0,
          avgScoreRate:
            avgReviewedScore > 0
              ? this.toFixedNumber(avgReviewedScore / 100)
              : 0,
        },
      };
    });
  }

  async getTeacherTodo(query: TeacherDashboardQueryDto): Promise<TeacherTodoDto> {
    const data = await this.buildTeacherSnapshot(query);
    return data.todo;
  }

  async getTeacherLessonFunnel(
    query: TeacherDashboardQueryDto,
  ): Promise<LessonFunnelItemDto[]> {
    const data = await this.buildTeacherSnapshot(query);
    return data.lessonFunnel;
  }

  async getTeacherScoreDistribution(
    query: TeacherDashboardQueryDto,
  ): Promise<ScoreDistributionDto> {
    const data = await this.buildTeacherSnapshot(query);
    return data.scoreDistribution;
  }

  async getTeacherObjectiveQuestionAccuracy(
    query: TeacherQuestionMetricQueryDto,
  ): Promise<TeacherObjectiveQuestionAccuracyPageDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    const teacherId = await this.getTeacherActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? TeacherQuestionMetricSortByMap.questionNo;
    const sortOrder = query.sortOrder ?? TeacherQuestionMetricSortOrderMap.ASC;

    const cacheKey = buildStatisticsCacheKey({
      scope: 'teacher',
      role: 'teacher',
      tenantId: schoolId,
      metricSet: 'teacher-objective-question-accuracy',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        teacherId,
        courseId: query.courseId,
        teachingGroupId: query.teachingGroupId,
        assignmentId: query.assignmentId,
        page,
        pageSize,
        sortBy,
        sortOrder,
      },
    });

    return this.withCache(cacheKey, 60, async () => {
      const result = await this.buildTeacherQuestionMetricPage(
        teacherId,
        query,
        range,
        [
          CourseAssignmentQuestionTypeMap.SINGLE_CHOICE,
          CourseAssignmentQuestionTypeMap.MULTIPLE_CHOICE,
          CourseAssignmentQuestionTypeMap.JUDGE,
        ],
        'correctRate',
      );

      return {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        list: result.list.map((item) => ({
          questionNo: item.questionNo,
          correctRate: item.metricRate,
        })),
      };
    });
  }

  async getTeacherFillQuestionScoreRate(
    query: TeacherQuestionMetricQueryDto,
  ): Promise<TeacherFillQuestionScoreRatePageDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    const teacherId = await this.getTeacherActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? TeacherQuestionMetricSortByMap.questionNo;
    const sortOrder = query.sortOrder ?? TeacherQuestionMetricSortOrderMap.ASC;

    const cacheKey = buildStatisticsCacheKey({
      scope: 'teacher',
      role: 'teacher',
      tenantId: schoolId,
      metricSet: 'teacher-fill-question-score-rate',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        teacherId,
        courseId: query.courseId,
        teachingGroupId: query.teachingGroupId,
        assignmentId: query.assignmentId,
        page,
        pageSize,
        sortBy,
        sortOrder,
      },
    });

    return this.withCache(cacheKey, 60, async () => {
      const result = await this.buildTeacherQuestionMetricPage(
        teacherId,
        query,
        range,
        [CourseAssignmentQuestionTypeMap.FILL_IN_THE_BLANK],
        'scoreRate',
      );

      return {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        list: result.list.map((item) => ({
          questionNo: item.questionNo,
          scoreRate: item.metricRate,
        })),
      };
    });
  }

  async getTeacherShortAnswerQuestionScoreRate(
    query: TeacherQuestionMetricQueryDto,
  ): Promise<TeacherShortAnswerQuestionScoreRatePageDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    const teacherId = await this.getTeacherActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? TeacherQuestionMetricSortByMap.questionNo;
    const sortOrder = query.sortOrder ?? TeacherQuestionMetricSortOrderMap.ASC;

    const cacheKey = buildStatisticsCacheKey({
      scope: 'teacher',
      role: 'teacher',
      tenantId: schoolId,
      metricSet: 'teacher-short-answer-score-rate',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        teacherId,
        courseId: query.courseId,
        teachingGroupId: query.teachingGroupId,
        assignmentId: query.assignmentId,
        page,
        pageSize,
        sortBy,
        sortOrder,
      },
    });

    return this.withCache(cacheKey, 60, async () => {
      const result = await this.buildTeacherQuestionMetricPage(
        teacherId,
        query,
        range,
        [CourseAssignmentQuestionTypeMap.SHORT_ANSWER],
        'scoreRate',
      );

      return {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        list: result.list.map((item) => ({
          questionNo: item.questionNo,
          scoreRate: item.metricRate,
        })),
      };
    });
  }

  private async buildTeacherQuestionMetricPage(
    teacherId: string,
    query: TeacherQuestionMetricQueryDto,
    range: TimeRange,
    questionTypes: number[],
    metricKind: 'correctRate' | 'scoreRate',
  ): Promise<{
    page: number;
    pageSize: number;
    total: number;
    list: Array<{ questionNo: number; metricRate: number }>;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? TeacherQuestionMetricSortByMap.questionNo;
    const sortOrder = query.sortOrder ?? TeacherQuestionMetricSortOrderMap.ASC;

    const baseQb = this.assignmentAnswerDetailRepo
      .createQueryBuilder('detail')
      .innerJoin(AssignmentSubmission, 'submission', 'submission.id = detail.submission_id')
      .innerJoin(CourseAssignment, 'assignment', 'assignment.id = submission.assignment_id')
      .innerJoin(CourseAssignmentQuestion, 'question', 'question.id = detail.question_id')
      .where('assignment.teacher_id = :teacherId', { teacherId })
      .andWhere('question.type IN (:...questionTypes)', { questionTypes });

    if (query.courseId) {
      baseQb.andWhere('assignment.course_id = :courseId', {
        courseId: query.courseId,
      });
    }
    if (query.assignmentId) {
      baseQb.andWhere('assignment.id = :assignmentId', {
        assignmentId: query.assignmentId,
      });
    }
    if (query.teachingGroupId) {
      baseQb.andWhere('submission.teaching_group_id = :groupId', {
        groupId: query.teachingGroupId,
      });
    }
    this.applyStringTimestampRange(baseQb, 'submission.create_time', range);

    const totalRaw = await baseQb
      .clone()
      .select('COUNT(DISTINCT question.id)', 'count')
      .getRawOne<{ count: string }>();

    const metricExpr =
      metricKind === 'correctRate'
        ? 'COALESCE(SUM(CASE WHEN detail.is_correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(1), 0), 0)'
        : 'COALESCE(SUM(COALESCE(CAST(detail.score AS DECIMAL(10,2)), 0)) / NULLIF(MAX(COALESCE(question.score, 0)) * COUNT(1), 0), 0)';

    const sortColumn = TeacherQuestionMetricSortColumnMap[sortBy];
    const rows = await baseQb
      .clone()
      .select('COALESCE(question.sort_order, 0) + 1', 'questionNo')
      .addSelect(metricExpr, 'metricRate')
      .groupBy('question.id')
      .addGroupBy('question.sort_order')
      .orderBy(sortColumn, sortOrder)
      .addOrderBy('questionNo', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<{
        questionNo: string;
        metricRate: string;
      }>();

    return {
      page,
      pageSize,
      total: this.toNumber(totalRaw?.count),
      list: rows.map((row) => ({
        questionNo: this.toNumber(row.questionNo),
        metricRate: this.toFixedNumber(this.toNumber(row.metricRate)),
      })),
    };
  }

  async getTeacherSubmissionStatus(
    query: TeacherDashboardQueryDto,
  ): Promise<SubmissionStatusDto> {
    const data = await this.buildTeacherSnapshot(query);
    return data.submissionStatus;
  }

  async getTeacherCourseGroupProgress(
    query: TeacherCourseGroupProgressQueryDto,
  ): Promise<TeacherCourseGroupProgressDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const teacherId = await this.getTeacherActorIdOrThrow(userId);
    await this.assertTeacherCourseAccess(teacherId, query.courseId);
    await this.assertTeachingGroupBelongsCourse(query.courseId, query.teachingGroupId);

    const schoolId = this.alsService.getSchoolId() || 'unknown-school';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy =
      query.sortBy ?? TeacherCourseProgressSortByMap.progressPercent;
    const sortOrder =
      query.sortOrder ?? TeacherCourseProgressSortOrderMap.DESC;
    const completedOnly =
      query.completedOnly ?? TeacherCourseProgressCompletedOnlyMap.all;

    const cacheKey = buildStatisticsCacheKey({
      scope: 'teacher',
      role: 'teacher',
      tenantId: schoolId,
      metricSet: 'teacher-course-group-progress',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        teacherId,
        courseId: query.courseId,
        teachingGroupId: query.teachingGroupId,
        page,
        pageSize,
        sortBy,
        sortOrder,
        completedOnly,
      },
    });

    return this.withCache(cacheKey, 60, async () => {
      const baseQb = this.courseStudentRepo
        .createQueryBuilder('cs')
        .innerJoin(Student, 'student', 'student.id = cs.student_id')
        .innerJoin(User, 'user', 'user.id = student.user_id')
        .where('cs.course_id = :courseId', { courseId: query.courseId })
        .andWhere('cs.group_id = :groupId', { groupId: query.teachingGroupId });
      this.applyStringTimestampRange(baseQb, 'cs.create_time', range);

      const totalStudentsRaw = await baseQb
        .clone()
        .select('COUNT(1)', 'count')
        .getRawOne<{ count: string }>();

      const completedStudentsRaw = await baseQb
        .clone()
        .andWhere('COALESCE(cs.progress_percent, 0) >= 100')
        .select('COUNT(1)', 'count')
        .getRawOne<{ count: string }>();

      const listQb = baseQb.clone();
      if (completedOnly === TeacherCourseProgressCompletedOnlyMap.completed) {
        listQb.andWhere('COALESCE(cs.progress_percent, 0) >= 100');
      }

      const totalRaw = await listQb
        .clone()
        .select('COUNT(1)', 'count')
        .getRawOne<{ count: string }>();

      const sortColumn = TeacherCourseProgressSortColumnMap[sortBy];
      const rows = await listQb
        .select('cs.student_id', 'studentId')
        .addSelect('COALESCE(user.name, :defaultName)', 'studentName')
        .addSelect('COALESCE(user.avatar, :defaultAvatar)', 'avatarPath')
        .addSelect('COALESCE(cs.progress_percent, 0)', 'progressPercent')
        .setParameter('defaultName', '未命名')
        .setParameter('defaultAvatar', '')
        .orderBy(sortColumn, sortOrder)
        .addOrderBy('cs.student_id', 'ASC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany<{
          studentId: string;
          studentName: string;
          avatarPath: string;
          progressPercent: string;
        }>();

      return {
        page,
        pageSize,
        total: this.toNumber(totalRaw?.count),
        totalStudents: this.toNumber(totalStudentsRaw?.count),
        completedStudents: this.toNumber(completedStudentsRaw?.count),
        list: rows.map((row) => ({
          studentId: row.studentId,
          studentName: row.studentName,
          avatarPath: row.avatarPath,
          progressPercent: this.toNumber(row.progressPercent),
        })),
      };
    });
  }

  private async buildTeacherSubmissionStatus(
    teacherId: string,
    query: TeacherDashboardQueryDto,
  ): Promise<SubmissionStatusDto> {
    let assignment: CourseAssignment | null = null;
    if (query.assignmentId) {
      assignment = await this.courseAssignmentRepo.findOne({
        where: { id: query.assignmentId, teacher_id: teacherId },
      });
      if (!assignment) {
        throw new NotFoundException('作业不存在或无权限访问');
      }
    } else {
      assignment = await this.courseAssignmentRepo.findOne({
        where: {
          teacher_id: teacherId,
          ...(query.courseId ? { course_id: query.courseId } : {}),
        },
        order: { create_time: 'DESC' },
      });
    }

    if (!assignment) {
      return this.buildEmptySubmissionStatus();
    }

    const targetGroupId = query.teachingGroupId || assignment.teaching_group_id;
    const studentQb = this.courseStudentRepo
      .createQueryBuilder('cs')
      .innerJoin(Student, 'student', 'student.id = cs.student_id')
      .innerJoin(User, 'user', 'user.id = student.user_id')
      .select('cs.student_id', 'studentId')
      .addSelect('COALESCE(user.name, :defaultName)', 'studentName')
      .where('cs.course_id = :courseId', { courseId: assignment.course_id })
      .setParameter('defaultName', '未命名');
    if (targetGroupId) {
      studentQb.andWhere('cs.group_id = :groupId', { groupId: targetGroupId });
    }
    const studentRows = await studentQb.getRawMany<{
      studentId: string;
      studentName: string;
    }>();

    if (studentRows.length === 0) {
      return this.buildEmptySubmissionStatus();
    }

    const submissionQb = this.assignmentSubmissionRepo
      .createQueryBuilder('submission')
      .select('submission.student_id', 'studentId')
      .addSelect('submission.status', 'status')
      .where('submission.assignment_id = :assignmentId', { assignmentId: assignment.id });
    if (targetGroupId) {
      submissionQb.andWhere('submission.teaching_group_id = :groupId', {
        groupId: targetGroupId,
      });
    }
    const submissionRows = await submissionQb.getRawMany<{
      studentId: string;
      status: string;
    }>();
    const statusMap = new Map(
      submissionRows.map((row) => [row.studentId, this.toNumber(row.status)]),
    );

    const result = this.buildEmptySubmissionStatus();
    for (const row of studentRows) {
      const item = {
        studentId: row.studentId,
        studentName: row.studentName,
      };
      const status = statusMap.get(row.studentId);
      if (
        status === undefined ||
        status === AssignmentSubmissionStatusMap.NOT_SUBMITTED
      ) {
        result.unsubmitted.push(item);
      } else if (status === AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW) {
        result.submittedPendingReview.push(item);
      } else if (status === AssignmentSubmissionStatusMap.REVIEWED) {
        result.reviewed.push(item);
      }
    }

    return result;
  }

  private async buildTeacherSnapshot(
    query: TeacherDashboardQueryDto,
  ): Promise<TeacherDashboardDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    const teacherId = await this.getTeacherActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const cacheKey = buildStatisticsCacheKey({
      scope: 'teacher',
      role: 'teacher',
      tenantId: schoolId,
      metricSet: 'teacher-snapshot',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        teacherId,
        courseId: query.courseId,
        teachingGroupId: query.teachingGroupId,
        assignmentId: query.assignmentId,
      },
    });

    return this.withCache(cacheKey, 120, async () => {
      const pendingQb = this.assignmentSubmissionRepo
        .createQueryBuilder('submission')
        .innerJoin(CourseAssignment, 'assignment', 'assignment.id = submission.assignment_id')
        .select('COUNT(1)', 'pendingReviewCount')
        .where('assignment.teacher_id = :teacherId', { teacherId })
        .andWhere('submission.status = :pendingStatus', {
          pendingStatus: AssignmentSubmissionStatusMap.SUBMITTED_PENDING_REVIEW,
        });
      if (query.courseId) {
        pendingQb.andWhere('assignment.course_id = :courseId', {
          courseId: query.courseId,
        });
      }
      if (query.assignmentId) {
        pendingQb.andWhere('assignment.id = :assignmentId', {
          assignmentId: query.assignmentId,
        });
      }
      if (query.teachingGroupId) {
        pendingQb.andWhere('submission.teaching_group_id = :groupId', {
          groupId: query.teachingGroupId,
        });
      }
      this.applyStringTimestampRange(pendingQb, 'submission.create_time', range);
      const pendingRaw = await pendingQb.getRawOne<{ pendingReviewCount: string }>();

      const courseIds = await this.resolveTeacherCourseIds(teacherId, query.courseId);
      if (courseIds.length === 0) {
        return {
          todo: {
            pendingReviewCount: this.toNumber(pendingRaw?.pendingReviewCount),
          },
          lessonFunnel: [],
          scoreDistribution: {
            avgScore: 0,
            maxScore: 0,
            minScore: 0,
            buckets: ScoreBucketMap.map((bucket) => ({
              key: bucket.key,
              label: bucket.label,
              count: 0,
            })),
          },
          questionAccuracy: [],
          submissionStatus: await this.buildTeacherSubmissionStatus(teacherId, query),
        };
      }

      const lessonQb = this.learningRecordRepo
        .createQueryBuilder('record')
        .leftJoin(CourseLesson, 'lesson', 'lesson.id = record.lesson_id')
        .select('record.lesson_id', 'lessonId')
        .addSelect('COALESCE(lesson.title, :defaultLessonName)', 'lessonName')
        .addSelect(
          'ROUND(AVG(COALESCE(record.progress_percent, 0)), 2)',
          'avgProgressPercent',
        )
        .addSelect('SUM(COALESCE(record.learn_count, 0))', 'learnCount')
        .where('record.course_id IN (:...courseIds)', { courseIds })
        .setParameter('defaultLessonName', '未命名课时');

      if (query.teachingGroupId) {
        lessonQb
          .innerJoin(
            CourseStudent,
            'cs',
            'cs.course_id = record.course_id AND cs.student_id = record.student_id',
          )
          .andWhere('cs.group_id = :groupId', { groupId: query.teachingGroupId });
      }
      this.applyStringTimestampRange(lessonQb, 'record.last_learn_time', range);
      const lessonRows = await lessonQb
        .groupBy('record.lesson_id')
        .addGroupBy('lesson.title')
        .orderBy('avgProgressPercent', 'ASC')
        .addOrderBy('learnCount', 'DESC')
        .limit(50)
        .getRawMany<{
          lessonId: string;
          lessonName: string;
          avgProgressPercent: string;
          learnCount: string;
        }>();

      const scoreQb = this.assignmentSubmissionRepo
        .createQueryBuilder('submission')
        .innerJoin(CourseAssignment, 'assignment', 'assignment.id = submission.assignment_id')
        .select('CAST(submission.total_score AS DECIMAL(10,2))', 'totalScore')
        .where('assignment.teacher_id = :teacherId', { teacherId })
        .andWhere('submission.status = :reviewedStatus', {
          reviewedStatus: AssignmentSubmissionStatusMap.REVIEWED,
        });
      if (query.courseId) {
        scoreQb.andWhere('assignment.course_id = :courseId', {
          courseId: query.courseId,
        });
      }
      if (query.assignmentId) {
        scoreQb.andWhere('assignment.id = :assignmentId', {
          assignmentId: query.assignmentId,
        });
      }
      if (query.teachingGroupId) {
        scoreQb.andWhere('submission.teaching_group_id = :groupId', {
          groupId: query.teachingGroupId,
        });
      }
      this.applyStringTimestampRange(scoreQb, 'submission.create_time', range);
      const scoreRows = await scoreQb.getRawMany<{ totalScore: string }>();

      const scores = scoreRows
        .map((row) => this.toNumber(row.totalScore))
        .filter((score) => Number.isFinite(score));
      const scoreSum = scores.reduce((sum, score) => sum + score, 0);
      const avgScore = scores.length > 0 ? this.toFixedNumber(scoreSum / scores.length, 2) : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const buckets = ScoreBucketMap.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        count: 0,
      }));
      for (const score of scores) {
        const bucket = ScoreBucketMap.find((item) => {
          const max = item.max ?? Number.POSITIVE_INFINITY;
          return score >= item.min && score <= max;
        });
        if (bucket) {
          const target = buckets.find((item) => item.key === bucket.key);
          if (target) {
            target.count += 1;
          }
        }
      }

      const questionQb = this.assignmentAnswerDetailRepo
        .createQueryBuilder('detail')
        .innerJoin(AssignmentSubmission, 'submission', 'submission.id = detail.submission_id')
        .innerJoin(CourseAssignment, 'assignment', 'assignment.id = submission.assignment_id')
        .innerJoin(CourseAssignmentQuestion, 'question', 'question.id = detail.question_id')
        .select('question.id', 'questionId')
        .addSelect('COALESCE(question.sort_order, 0) + 1', 'questionNo')
        .addSelect(
          'SUM(CASE WHEN detail.is_correct = 1 THEN 1 ELSE 0 END)',
          'correctCount',
        )
        .addSelect('COUNT(1)', 'totalCount')
        .where('assignment.teacher_id = :teacherId', { teacherId });

      if (query.courseId) {
        questionQb.andWhere('assignment.course_id = :courseId', {
          courseId: query.courseId,
        });
      }
      if (query.assignmentId) {
        questionQb.andWhere('assignment.id = :assignmentId', {
          assignmentId: query.assignmentId,
        });
      }
      if (query.teachingGroupId) {
        questionQb.andWhere('submission.teaching_group_id = :groupId', {
          groupId: query.teachingGroupId,
        });
      }
      this.applyStringTimestampRange(questionQb, 'submission.create_time', range);
      const questionRows = await questionQb
        .groupBy('question.id')
        .addGroupBy('question.sort_order')
        .orderBy('questionNo', 'ASC')
        .getRawMany<{
          questionId: string;
          questionNo: string;
          correctCount: string;
          totalCount: string;
        }>();

      return {
        todo: {
          pendingReviewCount: this.toNumber(pendingRaw?.pendingReviewCount),
        },
        lessonFunnel: lessonRows.map((row) => ({
          lessonId: row.lessonId,
          lessonName: row.lessonName,
          avgProgressPercent: this.toNumber(row.avgProgressPercent),
          learnCount: this.toNumber(row.learnCount),
        })),
        scoreDistribution: {
          avgScore,
          maxScore: this.toFixedNumber(maxScore, 2),
          minScore: this.toFixedNumber(minScore, 2),
          buckets,
        },
        questionAccuracy: questionRows.map((row) => {
          const totalCount = this.toNumber(row.totalCount);
          return {
            questionId: row.questionId,
            questionNo: this.toNumber(row.questionNo),
            correctRate:
              totalCount > 0
                ? this.toFixedNumber(this.toNumber(row.correctCount) / totalCount)
                : 0,
          };
        }),
        submissionStatus: await this.buildTeacherSubmissionStatus(teacherId, query),
      };
    });
  }

  async getStudentMyCourses(
    query: StudentLearningCenterQueryDto,
  ): Promise<StudentCourseProgressItemDto[]> {
    const data = await this.buildStudentSnapshot(query);
    return data.myCourses;
  }

  async getStudentContinueLearning(
    query: StudentLearningCenterQueryDto,
  ): Promise<ContinueLearningDto | null> {
    const data = await this.buildStudentSnapshot(query);
    return data.continueLearning;
  }

  async getStudentTodoAssignments(
    query: StudentLearningCenterQueryDto,
  ): Promise<TodoAssignmentItemDto[]> {
    const data = await this.buildStudentSnapshot(query);
    return data.todoAssignments;
  }

  async getStudentGradeHistory(
    query: StudentLearningCenterQueryDto,
  ): Promise<GradeHistoryItemDto[]> {
    const data = await this.buildStudentSnapshot(query);
    return data.gradeHistory;
  }

  async getStudentCourseGroupLearningSummary(
    query: StudentCourseGroupLearningSummaryQueryDto,
  ): Promise<StudentCourseGroupLearningSummaryDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const studentId = await this.getStudentActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const enrolledCourse = await this.courseStudentRepo.findOne({
      select: ['group_id'],
      where: {
        course_id: query.courseId,
        student_id: studentId,
      },
    });
    if (!enrolledCourse) {
      throw new NotFoundException('学生未加入该课程');
    }
    if (!enrolledCourse.group_id) {
      throw new BadRequestException('学生尚未加入教学组');
    }

    const teachingGroupId = enrolledCourse.group_id;
    const cacheKey = buildStatisticsCacheKey({
      scope: 'student',
      role: 'student',
      tenantId: schoolId,
      metricSet: 'student-group-learning-summary',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        studentId,
        courseId: query.courseId,
        teachingGroupId,
      },
    });

    return this.withCache(cacheKey, 120, async () => {
      const studentAvgQb = this.assignmentSubmissionRepo
        .createQueryBuilder('submission')
        .select('ROUND(AVG(CAST(submission.total_score AS DECIMAL(10,2))), 2)', 'avgScore')
        .where('submission.course_id = :courseId', { courseId: query.courseId })
        .andWhere('submission.student_id = :studentId', { studentId })
        .andWhere('submission.status = :reviewedStatus', {
          reviewedStatus: AssignmentSubmissionStatusMap.REVIEWED,
        });
      this.applyStringTimestampRange(studentAvgQb, 'submission.create_time', range);
      const studentAvgRaw = await studentAvgQb.getRawOne<{ avgScore: string | null }>();

      const groupAvgQb = this.assignmentSubmissionRepo
        .createQueryBuilder('submission')
        .innerJoin(
          CourseStudent,
          'cs',
          'cs.course_id = submission.course_id AND cs.student_id = submission.student_id',
        )
        .select('submission.student_id', 'studentId')
        .addSelect('ROUND(AVG(CAST(submission.total_score AS DECIMAL(10,2))), 2)', 'avgScore')
        .where('submission.course_id = :courseId', { courseId: query.courseId })
        .andWhere('submission.status = :reviewedStatus', {
          reviewedStatus: AssignmentSubmissionStatusMap.REVIEWED,
        })
        .andWhere('cs.group_id = :groupId', { groupId: teachingGroupId });
      this.applyStringTimestampRange(groupAvgQb, 'submission.create_time', range);
      const groupAvgRows = await groupAvgQb
        .groupBy('submission.student_id')
        .orderBy('avgScore', 'DESC')
        .addOrderBy('submission.student_id', 'ASC')
        .getRawMany<{ studentId: string; avgScore: string }>();

      let avgScoreRank = 0;
      let prevAvgScore: number | null = null;
      let currentRank = 0;
      for (let index = 0; index < groupAvgRows.length; index += 1) {
        const row = groupAvgRows[index];
        const rowAvgScore = this.toNumber(row.avgScore);
        if (prevAvgScore === null || rowAvgScore !== prevAvgScore) {
          currentRank = index + 1;
          prevAvgScore = rowAvgScore;
        }
        if (row.studentId === studentId) {
          avgScoreRank = currentRank;
          break;
        }
      }

      const learnCountQb = this.learningRecordRepo
        .createQueryBuilder('record')
        .select('SUM(COALESCE(record.learn_count, 0))', 'courseLearnCount')
        .where('record.student_id = :studentId', { studentId })
        .andWhere('record.course_id = :courseId', { courseId: query.courseId });
      this.applyStringTimestampRange(learnCountQb, 'record.last_learn_time', range);
      const learnCountRaw = await learnCountQb.getRawOne<{ courseLearnCount: string | null }>();

      return {
        courseId: query.courseId,
        teachingGroupId,
        assignmentAvgScore: this.toFixedNumber(this.toNumber(studentAvgRaw?.avgScore), 2),
        avgScoreRank,
        courseLearnCount: this.toNumber(learnCountRaw?.courseLearnCount),
      };
    });
  }

  private async buildStudentSnapshot(
    query: StudentLearningCenterQueryDto,
  ): Promise<StudentLearningCenterDto> {
    const range = this.parseTimeRange(query);
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    const studentId = await this.getStudentActorIdOrThrow(userId);
    const schoolId = this.alsService.getSchoolId() || 'unknown-school';

    const cacheKey = buildStatisticsCacheKey({
      scope: 'student',
      role: 'student',
      tenantId: schoolId,
      metricSet: 'student-snapshot',
      startTime: range.startTime,
      endTime: range.endTime,
      extras: {
        studentId,
        courseId: query.courseId,
      },
    });

    return this.withCache(cacheKey, 120, async () => {
      const myCourseQb = this.courseStudentRepo
        .createQueryBuilder('cs')
        .innerJoin(Course, 'course', 'course.id = cs.course_id')
        .select('course.id', 'courseId')
        .addSelect('course.name', 'courseName')
        .addSelect('COALESCE(cs.progress_percent, 0)', 'progressPercent')
        .where('cs.student_id = :studentId', { studentId });
      if (query.courseId) {
        myCourseQb.andWhere('cs.course_id = :courseId', { courseId: query.courseId });
      }
      this.applyStringTimestampRange(myCourseQb, 'cs.create_time', range);
      const myCourseRows = await myCourseQb.getRawMany<{
        courseId: string;
        courseName: string;
        progressPercent: string;
      }>();
      const myCourses = myCourseRows.map((row) => ({
        courseId: row.courseId,
        courseName: row.courseName,
        progressPercent: this.toNumber(row.progressPercent),
      }));
      const courseIds = myCourses.map((course) => course.courseId);

      const continueQb = this.learningRecordRepo
        .createQueryBuilder('record')
        .leftJoin(Course, 'course', 'course.id = record.course_id')
        .leftJoin(CourseLesson, 'lesson', 'lesson.id = record.lesson_id')
        .select('COALESCE(course.name, :defaultCourseName)', 'courseName')
        .addSelect('record.lesson_id', 'lessonId')
        .addSelect('COALESCE(lesson.title, :defaultLessonName)', 'lessonName')
        .addSelect('record.last_learn_time', 'lastLearnTime')
        .where('record.student_id = :studentId', { studentId })
        .setParameter('defaultCourseName', '未命名课程')
        .setParameter('defaultLessonName', '未命名课时');
      if (query.courseId) {
        continueQb.andWhere('record.course_id = :courseId', { courseId: query.courseId });
      }
      this.applyStringTimestampRange(continueQb, 'record.last_learn_time', range);
      const continueRaw = await continueQb
        .orderBy('CAST(record.last_learn_time AS UNSIGNED)', 'DESC')
        .limit(1)
        .getRawOne<{
          courseName: string;
          lessonId: string;
          lessonName: string;
          lastLearnTime: string;
        }>();

      let todoAssignments: StudentLearningCenterDto['todoAssignments'] = [];
      let gradeHistory: StudentLearningCenterDto['gradeHistory'] = [];

      if (courseIds.length > 0) {
        const assignmentQb = this.courseAssignmentRepo
          .createQueryBuilder('assignment')
          .innerJoin(Course, 'course', 'course.id = assignment.course_id')
          .select('assignment.id', 'assignmentId')
          .addSelect('COALESCE(course.name, :defaultCourseName)', 'courseName')
          .addSelect('assignment.title', 'title')
          .addSelect('assignment.deadline', 'deadline')
          .where('assignment.status = :publishedStatus', {
            publishedStatus: CourseAssignmentStatusMap.PUBLISHED,
          })
          .andWhere('assignment.course_id IN (:...courseIds)', { courseIds })
          .setParameter('defaultCourseName', '未命名课程');
        if (query.courseId) {
          assignmentQb.andWhere('assignment.course_id = :courseId', {
            courseId: query.courseId,
          });
        }
        this.applyStringTimestampRange(assignmentQb, 'assignment.create_time', range);
        const assignmentRows = await assignmentQb.getRawMany<{
          assignmentId: string;
          courseName: string;
          title: string;
          deadline?: string;
        }>();
        const assignmentIds = assignmentRows.map((row) => row.assignmentId);

        const submissionMap = new Map<string, number>();
        if (assignmentIds.length > 0) {
          const submissionRows = await this.assignmentSubmissionRepo
            .createQueryBuilder('submission')
            .select('submission.assignment_id', 'assignmentId')
            .addSelect('submission.status', 'status')
            .where('submission.student_id = :studentId', { studentId })
            .andWhere('submission.assignment_id IN (:...assignmentIds)', {
              assignmentIds,
            })
            .getRawMany<{ assignmentId: string; status: string }>();
          for (const row of submissionRows) {
            submissionMap.set(row.assignmentId, this.toNumber(row.status));
          }
        }

        const now = Math.floor(Date.now() / 1000);
        todoAssignments = assignmentRows
          .filter((row) => {
            const status = submissionMap.get(row.assignmentId);
            return (
              status === undefined ||
              status === AssignmentSubmissionStatusMap.NOT_SUBMITTED
            );
          })
          .map((row) => {
            const deadline = row.deadline ? String(row.deadline) : undefined;
            const remainSeconds = deadline
              ? Math.max(this.toNumber(deadline) - now, 0)
              : 0;
            return {
              assignmentId: row.assignmentId,
              courseName: row.courseName,
              title: row.title,
              deadline,
              remainSeconds,
            };
          })
          .sort((a, b) => a.remainSeconds - b.remainSeconds);

        const gradeQb = this.assignmentSubmissionRepo
          .createQueryBuilder('submission')
          .innerJoin(CourseAssignment, 'assignment', 'assignment.id = submission.assignment_id')
          .select('submission.assignment_id', 'assignmentId')
          .addSelect('assignment.title', 'title')
          .addSelect('CAST(submission.total_score AS DECIMAL(10,2))', 'totalScore')
          .addSelect('submission.teacher_comment', 'teacherComment')
          .addSelect('submission.grade_time', 'gradeTime')
          .where('submission.student_id = :studentId', { studentId })
          .andWhere('submission.status = :reviewedStatus', {
            reviewedStatus: AssignmentSubmissionStatusMap.REVIEWED,
          });
        if (query.courseId) {
          gradeQb.andWhere('assignment.course_id = :courseId', {
            courseId: query.courseId,
          });
        }
        this.applyStringTimestampRange(gradeQb, 'submission.grade_time', range);
        const gradeRows = await gradeQb
          .orderBy('CAST(submission.grade_time AS UNSIGNED)', 'DESC')
          .getRawMany<{
            assignmentId: string;
            title: string;
            totalScore: string;
            teacherComment?: string;
          }>();
        gradeHistory = gradeRows.map((row) => ({
          assignmentId: row.assignmentId,
          title: row.title,
          totalScore: this.toNumber(row.totalScore),
          teacherComment: row.teacherComment || undefined,
        }));
      }

      return {
        myCourses,
        continueLearning: continueRaw
          ? {
              courseName: continueRaw.courseName,
              lessonId: continueRaw.lessonId,
              lessonName: continueRaw.lessonName,
              lastLearnTime: String(continueRaw.lastLearnTime),
            }
          : null,
        todoAssignments,
        gradeHistory,
      };
    });
  }

  async getStatisticsDictionary(
    query: StatisticsDictionaryQueryDto,
  ): Promise<StatisticsDictionaryDto> {
    const scope = query.scope as StatisticsScope | undefined;
    const metricDefinitions = scope
      ? StatisticsMetricMap.filter((item) => item.scopes.includes(scope))
      : StatisticsMetricMap;

    return {
      metricDefinitions,
      scoreBuckets: ScoreBucketMap.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        count: 0,
      })),
      timeGranularity: [
        { key: 'day', label: '按天' },
        { key: 'week', label: '按周' },
        { key: 'month', label: '按月' },
        { key: 'term', label: '按学期' },
      ],
    };
  }
}
