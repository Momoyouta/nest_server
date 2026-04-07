import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  getInviteValue,
  generateInviteCode,
  createInviteCode,
} from '@/common/utils/invite.util';
import {
  CreateCourseInviteDto,
  CreateCourseInviteResponseDto,
  CreateInviteDto,
  InvitationDataDto,
  InvitationQueryDto,
} from '@/common/dto/invite.dto';
import {
  JoinCourseByInviteCodeDto,
  JoinCourseByInviteCodeResponseDto,
} from '@/modules/student/dto/join-course-by-invite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { InvitationCode } from '@/database/entities/invitation_code.entity';
import { Repository, DataSource } from 'typeorm';
import { School } from '@/database/entities/school.entity';
import { User } from '@/database/entities/user.entity';
import { Course } from '@/database/entities/course.entity';
import { CourseTeachingGroup } from '@/database/entities/course_teaching_group.entity';
import { CourseGroupTeacher } from '@/database/entities/course_group_teacher.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import {
  AdminRolesMap,
  PlatformAdminRoles,
  SchoolAdminRoles,
} from '@/common/utils/role.map';
import { InvitationTypeMap } from '@/common/utils/invite-type.map';
import { Student } from '@/database/entities/student.entity';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { UserSchoolIdentity } from '@/database/entities/user_school_identity.entity';
import { JoinSchoolByInviteCodeResponseDto } from '../auth/dto/join-school-by-invite.dto';

@Injectable()
export class InvitationService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @InjectRepository(InvitationCode)
    private readonly invitationRepository: Repository<InvitationCode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseTeachingGroup)
    private readonly courseTeachingGroupRepository: Repository<CourseTeachingGroup>,
    @InjectRepository(CourseGroupTeacher)
    private readonly courseGroupTeacherRepository: Repository<CourseGroupTeacher>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(CourseStudent)
    private readonly courseStudentRepository: Repository<CourseStudent>,
    @InjectRepository(UserSchoolIdentity)
    private readonly userSchoolIdentityRepository: Repository<UserSchoolIdentity>,
    private readonly alsService: AsyncLocalstorageService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * 创建邀请码并存储到数据库和 Redis
   */
  async createInvite(dto: CreateInviteDto, creatorId: string): Promise<string> {
    const now = String(Math.floor(Date.now() / 1000));

    const invitationData: InvitationDataDto = {
      type: dto.type,
      school_id: dto.school_id,
      grade: dto.grade,
      class_id: dto.class_id,
      creater_id: creatorId,
      create_time: now,
      ttl: dto.ttl,
    };

    // 使用加密逻辑生成邀请码
    const code = generateInviteCode(invitationData);

    // 1. 存储到数据库
    const invite = this.invitationRepository.create({
      code,
      type: dto.type,
      school_id: dto.school_id,
      grade: dto.grade,
      class_id: dto.class_id,
      creater_id: creatorId,
      create_time: now,
      ttl: dto.ttl,
    });
    await this.invitationRepository.save(invite);

    // 2. 存储到 Redis (用于快速校验和撤回)
    await createInviteCode(this.redis, code, invitationData, dto.ttl);

    return code;
  }

  async createCourseInviteByCurrentUser(
    dto: CreateCourseInviteDto,
  ): Promise<CreateCourseInviteResponseDto> {
    const user = await this.getCurrentUserOrThrow();
    const roleIds = this.parseRoleIds(user);

    const course = await this.courseRepository.findOne({
      where: { id: dto.course_id },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const teachingGroup = await this.courseTeachingGroupRepository.findOne({
      where: {
        id: dto.teaching_group_id,
        course_id: course.id,
      },
    });
    if (!teachingGroup) {
      throw new NotFoundException('教学组不存在');
    }

    const schoolId = await this.resolveSchoolIdForInvite(user, roleIds, dto);
    if (schoolId !== course.school_id) {
      throw new ForbiddenException('无权对非本校课程发放邀请码');
    }

    const isTeacher = roleIds.includes(AdminRolesMap.teacher);
    if (isTeacher) {
      const teacher = await this.teacherRepository.findOne({
        where: { user_id: user.id },
      });
      if (!teacher?.id) {
        throw new ForbiddenException('当前用户不是教师');
      }
      if (teacher.school_id !== course.school_id) {
        throw new ForbiddenException('教师无权为非本校课程发码');
      }

      const relation = await this.courseGroupTeacherRepository.findOne({
        where: {
          group_id: teachingGroup.id,
          teacher_id: teacher.id,
        },
      });
      if (!relation) {
        throw new ForbiddenException('教师未绑定该课程教学组，无法发码');
      }
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const now = String(nowSec);
    const ttlSec = dto.ttl ?? 0;

    const invitationData: InvitationDataDto = {
      type: Number(InvitationTypeMap.STUDENT_JOIN_COURSE),
      school_id: course.school_id,
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      creater_id: user.id,
      create_time: now,
      ttl: ttlSec,
    };

    // 使用加密逻辑生成邀请码
    const code = generateInviteCode(invitationData);

    const invite = this.invitationRepository.create({
      code,
      type: Number(InvitationTypeMap.STUDENT_JOIN_COURSE),
      school_id: course.school_id,
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      creater_id: user.id,
      create_time: now,
      ttl: ttlSec,
    });
    await this.invitationRepository.save(invite);

    await createInviteCode(
      this.redis,
      code,
      invitationData,
      ttlSec > 0 ? ttlSec : undefined,
    );

    return {
      code,
      type: Number(InvitationTypeMap.STUDENT_JOIN_COURSE),
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      createTime: now,
      ttl: ttlSec,
      expire_time: ttlSec > 0 ? String(nowSec + ttlSec) : null,
    };
  }

  /**
   * 学生通过邀请码加入课程
   */
  async joinCourseByInviteCode(
    userId: string,
    code: string,
  ): Promise<JoinCourseByInviteCodeResponseDto> {
    const student = await this.studentRepository.findOne({
      where: { user_id: userId },
    });
    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const inviteData = await this.getInviteDataPreferRedis(code);
    if (!inviteData) {
      throw new BadRequestException('邀请码不存在或已过期');
    }

    if (
      Number(inviteData.type) !== Number(InvitationTypeMap.STUDENT_JOIN_COURSE)
    ) {
      throw new BadRequestException('邀请码类型不匹配');
    }

    if (!inviteData.course_id || !inviteData.teaching_group_id) {
      throw new BadRequestException('课程邀请码数据缺失');
    }

    // 学校校验
    if (
      student.school_id &&
      inviteData.school_id &&
      String(student.school_id) !== String(inviteData.school_id)
    ) {
      throw new BadRequestException('邀请码所属学校与学生当前学校不匹配');
    }

    const course = await this.courseRepository.findOne({
      where: { id: inviteData.course_id },
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const teachingGroup = await this.courseTeachingGroupRepository.findOne({
      where: {
        id: inviteData.teaching_group_id,
        course_id: course.id,
      },
    });
    if (!teachingGroup) {
      throw new NotFoundException('教学组不存在');
    }

    // 幂等校验
    const existing = await this.courseStudentRepository.findOne({
      where: {
        course_id: course.id,
        student_id: student.id,
      },
    });
    if (existing) {
      throw new BadRequestException('已加入该课程');
    }

    const relation = this.courseStudentRepository.create({
      course_id: course.id,
      student_id: student.id,
      group_id: teachingGroup.id,
    });
    await this.courseStudentRepository.save(relation);

    return {
      course_id: course.id,
      teaching_group_id: teachingGroup.id,
      joined: true,
    };
  }

  /**
   * 用户通过邀请码加入学校
   */
  async joinSchoolByInviteCode(
    userId: string,
    code: string,
  ): Promise<JoinSchoolByInviteCodeResponseDto> {
    const inviteData = await this.getInviteDataPreferRedis(code);
    if (!inviteData) {
      throw new BadRequestException('邀请码不存在或已过期');
    }

    const type = Number(inviteData.type);
    if (
      type !== Number(InvitationTypeMap.TEACHER_JOIN_SCHOOL) &&
      type !== Number(InvitationTypeMap.STUDENT_JOIN_SCHOOL)
    ) {
      throw new BadRequestException('邀请码类型不匹配，非加入学校邀请码');
    }

    const schoolId = String(inviteData.school_id);
    if (!schoolId) {
      throw new BadRequestException('邀请码数据异常：缺失学校ID');
    }

    return await this.dataSource.transaction(async (manager) => {
      const teacherRepo = manager.getRepository(Teacher);
      const studentRepo = manager.getRepository(Student);
      const identityRepo = manager.getRepository(UserSchoolIdentity);

      const actorType =
        type === Number(InvitationTypeMap.TEACHER_JOIN_SCHOOL) ? 1 : 2;

      // 1. 幂等校验：是否已拥有该学校的该身份
      const existingIdentity = await identityRepo.findOne({
        where: {
          user_id: userId,
          school_id: schoolId,
          actor_type: actorType,
          status: 1,
        },
      });

      if (existingIdentity) {
        return {
          school_id: schoolId,
          actor_type: actorType,
          actor_id: existingIdentity.actor_id,
          joined: true,
        };
      }

      let actorId = '';

      if (actorType === 1) {
        // 加入为老师
        let teacher = await teacherRepo.findOne({
          where: { user_id: userId, school_id: schoolId },
        });
        if (!teacher) {
          teacher = teacherRepo.create({
            user_id: userId,
            school_id: schoolId,
          });
          await teacherRepo.save(teacher);
        }
        actorId = teacher.id;
      } else {
        // 加入为学生
        let student = await studentRepo.findOne({
          where: { user_id: userId, school_id: schoolId },
        });
        if (!student) {
          student = studentRepo.create({
            user_id: userId,
            school_id: schoolId,
          });
          await studentRepo.save(student);
        }
        actorId = student.id;
      }

      // 2. 创建或更新多租户身份映射
      const newIdentity = identityRepo.create({
        user_id: userId,
        school_id: schoolId,
        actor_type: actorType,
        actor_id: actorId,
        status: 1,
      });
      await identityRepo.save(newIdentity);

      return {
        school_id: schoolId,
        actor_type: actorType,
        actor_id: actorId,
        joined: true,
      };
    });
  }

  /**
   * 删除邀请码
   */
  async deleteInvite(code: string): Promise<void> {
    await this.invitationRepository.delete({ code });
    const prefix = 'invite:';
    await this.redis.del(prefix + code);
  }

  /**
   * 获取邀请码列表 (带分页和多条件过滤)
   */
  async findAll(query: InvitationQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      code,
      creater_id,
      school_id,
      class_id,
      grade,
      course_id,
      teaching_group_id,
      type,
    } = query;

    const qb = this.invitationRepository
      .createQueryBuilder('ic')
      .leftJoin(School, 's', 'ic.school_id = s.id')
      .leftJoin(User, 'u', 'ic.creater_id = u.id')
      .select([
        'ic.code as code',
        'ic.type as type',
        'ic.school_id as school_id',
        's.name as school_name',
        'ic.grade as grade',
        'ic.class_id as class_id',
        'ic.course_id as course_id',
        'ic.teaching_group_id as teaching_group_id',
        'ic.creater_id as creater_id',
        'u.name as creator_name',
        'ic.create_time as create_time',
        'ic.ttl as ttl',
      ]);

    if (code) qb.andWhere('ic.code LIKE :code', { code: `%${code}%` });
    if (creater_id) qb.andWhere('ic.creater_id = :creater_id', { creater_id });
    if (school_id) qb.andWhere('ic.school_id = :school_id', { school_id });
    if (class_id) qb.andWhere('ic.class_id = :class_id', { class_id });
    if (grade) qb.andWhere('ic.grade LIKE :grade', { grade: `%${grade}%` });
    if (course_id) qb.andWhere('ic.course_id = :course_id', { course_id });
    if (teaching_group_id) {
      qb.andWhere('ic.teaching_group_id = :teaching_group_id', {
        teaching_group_id,
      });
    }
    if (type !== undefined) qb.andWhere('ic.type = :type', { type });

    const total = await qb.getCount();
    const list = await qb
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    return { list, total };
  }

  /**
   * 获取邀请码对应的数据 (用于校验)
   */
  async getInviteData(code: string): Promise<InvitationDataDto | null> {
    const invite = await this.invitationRepository.findOne({ where: { code } });
    if (!invite || this.isExpired(invite)) return null;

    return this.toInvitationData(invite);
  }

  async getInviteDataPreferRedis(
    code: string,
  ): Promise<InvitationDataDto | null> {
    const redisData = await getInviteValue<InvitationDataDto>(this.redis, code);
    if (
      redisData &&
      typeof redisData === 'object' &&
      redisData.type !== undefined
    ) {
      return redisData;
    }

    const invite = await this.invitationRepository.findOne({ where: { code } });
    if (!invite || this.isExpired(invite)) {
      return null;
    }

    const invitationData = this.toInvitationData(invite);
    await createInviteCode(
      this.redis,
      code,
      invitationData,
      invite.ttl || undefined,
    );
    return invitationData;
  }

  async cleanExpiredInvitations(): Promise<{
    expiredDeletedCount: number;
    orphanCacheDeletedCount: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const expiredInvites = await this.invitationRepository
      .createQueryBuilder('ic')
      .select(['ic.id AS id', 'ic.code AS code'])
      .where('ic.ttl IS NOT NULL')
      .andWhere('ic.ttl > 0')
      .andWhere('(CAST(ic.create_time AS UNSIGNED) + ic.ttl) <= :now', { now })
      .getRawMany<{ id: number; code: string | null }>();

    if (expiredInvites.length > 0) {
      await this.invitationRepository.delete(
        expiredInvites.map((item) => Number(item.id)),
      );
      const expiredKeys = expiredInvites
        .map((item) => String(item.code || '').trim())
        .filter((item) => item.length > 0)
        .map((code) => `invite:${code}`);
      if (expiredKeys.length > 0) {
        await this.redis.del(...expiredKeys);
      }
    }

    const redisKeys = await this.redis.keys('invite:*');
    let orphanCacheDeletedCount = 0;
    if (redisKeys.length > 0) {
      const codes = redisKeys.map((key) => key.replace(/^invite:/, ''));
      const dbRecords = await this.invitationRepository
        .createQueryBuilder('ic')
        .select('ic.code', 'code')
        .where('ic.code IN (:...codes)', { codes })
        .getRawMany<{ code: string | null }>();
      const dbCodeSet = new Set(
        dbRecords
          .map((item) => String(item.code || '').trim())
          .filter((item) => item.length > 0),
      );
      const orphanKeys = redisKeys.filter((key) => {
        const code = key.replace(/^invite:/, '');
        return !dbCodeSet.has(code);
      });
      if (orphanKeys.length > 0) {
        orphanCacheDeletedCount = await this.redis.del(...orphanKeys);
      }
    }

    return {
      expiredDeletedCount: expiredInvites.length,
      orphanCacheDeletedCount,
    };
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

    return user;
  }

  private parseRoleIds(user: User): string[] {
    return String(user.role_id || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private async resolveSchoolIdForInvite(
    user: User,
    roleIds: string[],
    dto: CreateCourseInviteDto,
  ): Promise<string> {
    const isPlatformAdmin = roleIds.some((roleId) =>
      PlatformAdminRoles.includes(roleId),
    );
    const isSchoolAdmin = roleIds.some((roleId) =>
      SchoolAdminRoles.includes(roleId),
    );
    const isTeacher = roleIds.includes(AdminRolesMap.teacher);

    if (isSchoolAdmin) {
      const schoolAdmin = await this.schoolAdminRepository.findOne({
        where: { user_id: user.id },
      });
      if (!schoolAdmin?.school_id) {
        throw new BadRequestException('学校管理员未绑定学校');
      }
      if (dto.school_id && dto.school_id !== schoolAdmin.school_id) {
        throw new ForbiddenException('无权对其他学校发码');
      }
      return schoolAdmin.school_id;
    }

    if (isPlatformAdmin) {
      if (!dto.school_id) {
        throw new BadRequestException('平台管理员必须传入 school_id');
      }
      return dto.school_id;
    }

    if (isTeacher) {
      const teacher = await this.teacherRepository.findOne({
        where: { user_id: user.id },
      });
      if (!teacher?.school_id) {
        throw new BadRequestException('教师未绑定学校');
      }
      if (dto.school_id && dto.school_id !== teacher.school_id) {
        throw new ForbiddenException('教师无权对其他学校发码');
      }
      return teacher.school_id;
    }

    throw new ForbiddenException('当前用户无邀请码发放权限');
  }

  private isExpired(invite: InvitationCode): boolean {
    const ttl = Number(invite.ttl || 0);
    if (!ttl || ttl <= 0) {
      return false;
    }
    const createSec = Number(invite.create_time || 0);
    if (!createSec) {
      return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return createSec + ttl <= now;
  }

  private toInvitationData(invite: InvitationCode): InvitationDataDto {
    return {
      type: Number(invite.type),
      school_id: String(invite.school_id || ''),
      grade: invite.grade,
      class_id: invite.class_id,
      course_id: invite.course_id,
      teaching_group_id: invite.teaching_group_id,
      creater_id: String(invite.creater_id || ''),
      create_time: String(invite.create_time || ''),
      ttl: invite.ttl,
    };
  }
}
