import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectRepository as BaseInjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Teacher } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeacherService {
  constructor(
    @BaseInjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @BaseInjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAll(query: BaseQueryDto) {
    const { page = 1, pageSize = 10, id, name, phone, school_id, teacher_number, status } = query as any;
    const qb = this.teacherRepository.createQueryBuilder('teacher');
    qb.leftJoinAndSelect('teacher.user', 'user');

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }
    if (id) {
      qb.andWhere('teacher.id = :id', { id });
    }
    if (teacher_number) {
      qb.andWhere('teacher.teacher_number = :teacher_number', { teacher_number });
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

    const flatItems = items.map(item => {
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
        data.user.password = await bcrypt.hash(String(data.user.password), await bcrypt.genSalt(10));
      }
      data.user.update_time = String(Math.floor(Date.now() / 1000));
      await this.userRepository.update(teacher.user_id, data.user);
      await this.teacherRepository.update(teacher.id, data.teacher || data);
    } else {
      const userFields = this.userRepository.metadata.columns.map(c => c.propertyName);
      const userData: any = {};
      const teacherData: any = {};

      const excludeFields = ['id', 'user_id', 'organization', 'roleNames', 'school_admin_id', 'institution', 'create_time', 'update_time', 'user'];

      const now = String(Math.floor(Date.now() / 1000));
      for (const ObjectKey of Object.keys(data)) {
        const key = ObjectKey;
        if (excludeFields.includes(key)) continue;

        if (userFields.includes(key)) {
          if (key === 'password' && data[key]) {
            userData[key] = await bcrypt.hash(String(data[key]), await bcrypt.genSalt(10));
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
}
