import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CourseService } from '../course/course.service';
import { AsyncLocalstorageService } from '../async/async/asyncLocalstorage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRepository as BaseInjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Teacher } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { CourseTeachingGroup } from '../../database/entities/course_teaching_group.entity';
import { CourseGroupTeacher } from '../../database/entities/course_group_teacher.entity';
import { InvitationCode } from '../../database/entities/invitation_code.entity';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import * as bcrypt from 'bcrypt';
import { In } from 'typeorm';

@Injectable()
export class TeacherService {
  constructor(
    @BaseInjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @BaseInjectRepository(User)
    private userRepository: Repository<User>,
    @BaseInjectRepository(CourseTeachingGroup)
    private teachingGroupRepository: Repository<CourseTeachingGroup>,
    @BaseInjectRepository(CourseGroupTeacher)
    private groupTeacherRepository: Repository<CourseGroupTeacher>,
    @BaseInjectRepository(InvitationCode)
    private invitationRepository: Repository<InvitationCode>,
    private readonly courseService: CourseService,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

  async findAll(query: BaseQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      id,
      name,
      phone,
      school_id,
      teacher_number,
      status,
    } = query as any;
    const qb = this.teacherRepository.createQueryBuilder('teacher');
    qb.leftJoinAndSelect('teacher.user', 'user');

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }
    if (id) {
      qb.andWhere('teacher.id = :id', { id });
    }
    if (teacher_number) {
      qb.andWhere('teacher.teacher_number = :teacher_number', {
        teacher_number,
      });
    }
    if (name) {
      qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      qb.andWhere('user.account LIKE :phone', { phone: `%${phone}%` });
    }
    if (school_id) {
      qb.andWhere('teacher.school_id = :school_id', { school_id });
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    qb.orderBy('teacher.id', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    const flatItems = items.map((item) => {
      const { user, id: teacher_id, ...rest } = item as any;
      if (user) {
        return { teacher_id, ...rest, ...user };
      }
      return { teacher_id, ...rest };
    });

    return { items: flatItems, total };
  }

  async findOne(userId: string) {
    const teacher = await this.teacherRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!teacher) throw new NotFoundException('教师不存在');
    return teacher;
  }

  async update(userId: string, data: any) {
    const teacher = await this.findOne(userId);
    if (data.user) {
      if (data.user.password) {
        data.user.password = await bcrypt.hash(
          String(data.user.password),
          await bcrypt.genSalt(10),
        );
      }
      data.user.update_time = String(Math.floor(Date.now() / 1000));
      await this.userRepository.update(teacher.user_id, data.user);
      await this.teacherRepository.update(teacher.id, data.teacher || data);
    } else {
      const userFields = this.userRepository.metadata.columns.map(
        (c) => c.propertyName,
      );
      const userData: any = {};
      const teacherData: any = {};

      const excludeFields = [
        'id',
        'user_id',
        'organization',
        'roleNames',
        'school_admin_id',
        'institution',
        'create_time',
        'update_time',
        'user',
      ];

      const now = String(Math.floor(Date.now() / 1000));
      for (const ObjectKey of Object.keys(data)) {
        const key = ObjectKey;
        if (excludeFields.includes(key)) continue;

        if (userFields.includes(key)) {
          if (key === 'password' && data[key]) {
            userData[key] = await bcrypt.hash(
              String(data[key]),
              await bcrypt.genSalt(10),
            );
          } else {
            userData[key] = data[key];
          }
        } else {
          teacherData[key] = data[key];
        }
      }

      if (Object.keys(userData).length > 0) {
        userData.update_time = now;
        await this.userRepository.update(teacher.user_id, userData);
      }
      if (Object.keys(teacherData).length > 0) {
        await this.teacherRepository.update(teacher.id, teacherData);
      }
    }
    return this.findOne(userId);
  }

  async softDelete(userId: string) {
    const teacher = await this.findOne(userId);
    await this.userRepository.update(teacher.user_id, { status: 2 });
    return { success: true };
  }

  async leaveCourse(courseId: string): Promise<{ success: boolean }> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { user_id: userId },
    });
    if (!teacher) {
      throw new NotFoundException('教师信息不存在');
    }

    await this.courseService.removeTeacherFromCourse(teacher.id, courseId);

    return { success: true };
  }

  async getMyGroups(courseId: string) {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { user_id: userId },
    });
    if (!teacher) {
      throw new NotFoundException('教师信息不存在');
    }

    // 1. 查找该教师在该课程中所属的教学组ID
    const teacherGroups = await this.groupTeacherRepository
      .createQueryBuilder('gt')
      .innerJoin(CourseTeachingGroup, 'tg', 'gt.group_id = tg.id')
      .where('tg.course_id = :courseId', { courseId })
      .andWhere('gt.teacher_id = :teacherId', { teacherId: teacher.id })
      .select('gt.group_id', 'groupId')
      .getRawMany();

    const groupIds = teacherGroups.map((g) => g.groupId);
    if (groupIds.length === 0) {
      return [];
    }

    // 2. 查找这些教学组的基本信息
    const groups = await this.teachingGroupRepository.find({
      where: { id: In(groupIds) },
    });

    // 3. 查找这些教学组的所有成员信息
    const members = await this.groupTeacherRepository
      .createQueryBuilder('gt')
      .innerJoin(Teacher, 't', 'gt.teacher_id = t.id')
      .innerJoin(User, 'u', 't.user_id = u.id')
      .where('gt.group_id IN (:...groupIds)', { groupIds })
      .select([
        'gt.group_id as group_id',
        't.id as teacher_id',
        'u.name as teacher_name',
      ])
      .getRawMany();

    // 4. 查找这些教学组的邀请码
    const invitations = await this.invitationRepository.find({
      where: {
        teaching_group_id: In(groupIds),
        type: 2, // STUDENT_JOIN_COURSE
      },
      order: {
        create_time: 'DESC',
      },
    });

    return groups.map((group) => {
      const groupInvite = invitations.find(
        (inv) => inv.teaching_group_id === group.id,
      );
      let expireTime: string | null = null;
      if (groupInvite && groupInvite.ttl > 0) {
        expireTime = String(
          Number(groupInvite.create_time) + Number(groupInvite.ttl),
        );
      }

      return {
        ...group,
        invite_code: groupInvite?.code || null,
        expire_time: expireTime,
        teachers: members
          .filter((m) => m.group_id === group.id)
          .map((m) => ({
            teacher_id: m.teacher_id,
            name: m.teacher_name,
          })),
      };
    });
  }

  async listMyCreatedCourses(query: any) {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }
    return this.courseService.listMyCreatedCourses(query, userId);
  }

  async createCourse(payload: any) {
    return this.courseService.createCourseUser(payload);
  }
}
