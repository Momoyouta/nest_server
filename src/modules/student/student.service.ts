import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Student } from '../../database/entities/student.entity';
import { User } from '../../database/entities/user.entity';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import * as bcrypt from 'bcrypt';
import { CourseStudent } from '@/database/entities/course_student.entity';
import { CourseTeachingGroup } from '@/database/entities/course_teaching_group.entity';
import { Course } from '@/database/entities/course.entity';
import { InvitationService } from '@/modules/invitation/invitation.service';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { InvitationTypeMap } from '@/common/utils/invite-type.map';
import {
  JoinCourseByInviteCodeDto,
  JoinCourseByInviteCodeResponseDto,
} from '@/modules/student/dto/join-course-by-invite.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CourseStudent)
    private courseStudentRepository: Repository<CourseStudent>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(CourseTeachingGroup)
    private courseTeachingGroupRepository: Repository<CourseTeachingGroup>,
    private readonly invitationService: InvitationService,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

  async joinCourseByInviteCode(
    payload: JoinCourseByInviteCodeDto,
  ): Promise<JoinCourseByInviteCodeResponseDto> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const student = await this.studentRepository.findOne({
      where: { user_id: userId },
    });
    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const inviteData = await this.invitationService.getInviteDataPreferRedis(
      payload.code,
    );
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

    if (
      student.school_id &&
      inviteData.school_id &&
      String(student.school_id) !== String(inviteData.school_id)
    ) {
      throw new BadRequestException('邀请码所属学校与学生不匹配');
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

  async findAll(query: BaseQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      id,
      name,
      phone,
      school_id,
      student_number,
      status,
    } = query as any;
    const qb = this.studentRepository.createQueryBuilder('student');
    qb.leftJoinAndSelect('student.user', 'user');

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }
    if (id) {
      qb.andWhere('student.id = :id', { id });
    }
    if (student_number) {
      qb.andWhere('student.student_number = :student_number', {
        student_number,
      });
    }
    if (name) {
      qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      qb.andWhere('user.account LIKE :phone', { phone: `%${phone}%` });
    }
    if (school_id) {
      qb.andWhere('student.school_id = :school_id', { school_id });
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    qb.orderBy('student.id', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    const flatItems = items.map((item) => {
      const { user, id: student_id, ...rest } = item as any;
      if (user) {
        return { student_id, ...rest, ...user };
      }
      return { student_id, ...rest };
    });

    return { items: flatItems, total };
  }

  async findOne(userId: string) {
    const student = await this.studentRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('学生不存在');
    return student;
  }

  async update(userId: string, data: any) {
    const student = await this.findOne(userId);
    if (data.user) {
      if (data.user.password) {
        data.user.password = await bcrypt.hash(
          String(data.user.password),
          await bcrypt.genSalt(10),
        );
      }
      data.user.update_time = String(Math.floor(Date.now() / 1000));
      await this.userRepository.update(student.user_id, data.user);
      await this.studentRepository.update(student.id, data.student || data);
    } else {
      const userFields = this.userRepository.metadata.columns.map(
        (c) => c.propertyName,
      );
      const userData: any = {};
      const studentData: any = {};

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
          studentData[key] = data[key];
        }
      }

      if (Object.keys(userData).length > 0) {
        userData.update_time = now;
        await this.userRepository.update(student.user_id, userData);
      }
      if (Object.keys(studentData).length > 0) {
        await this.studentRepository.update(student.id, studentData);
      }
    }
    return this.findOne(userId);
  }

  async softDelete(userId: string) {
    const student = await this.findOne(userId);
    await this.userRepository.update(student.user_id, { status: 2 });
    return { success: true };
  }
}
