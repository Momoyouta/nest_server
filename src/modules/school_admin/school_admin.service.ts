import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SchoolAdmin } from '../../database/entities/school_admin.entity';
import { User } from '../../database/entities/user.entity';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import * as bcrypt from 'bcrypt';
import { SchoolAdminRoles } from '@/common/utils/role.map';
@Injectable()
export class SchoolAdminService {
  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(query: BaseQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      id,
      name,
      phone,
      school_id,
      status,
    } = query as any;
    const qb = this.schoolAdminRepository.createQueryBuilder('school_admin');
    qb.leftJoinAndSelect('school_admin.user', 'user');
    qb.where('user.role_id IN (:...roles) ', { roles: SchoolAdminRoles });
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }
    if (id) {
      qb.andWhere('user.id = :id', { id });
    }
    if (name) {
      qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }
    if (phone) {
      qb.andWhere('user.account LIKE :phone', { phone: `%${phone}%` });
    }
    if (school_id) {
      qb.andWhere('school_admin.school_id = :school_id', { school_id });
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    qb.orderBy('school_admin.id', 'DESC');

    const [items, total] = await qb.getManyAndCount();

    const flatItems = items.map((item) => {
      const { user, id: school_admin_id, ...rest } = item as any;
      if (user) {
        return { school_admin_id, ...rest, ...user };
      }
      return { school_admin_id, ...rest };
    });

    return { items: flatItems, total };
  }

  async findOne(userId: string) {
    const admin = await this.schoolAdminRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
    if (!admin) throw new NotFoundException('学校管理员不存在');
    return admin;
  }

  async create(data: any) {
    const { account, name, password, phone, role_id, sex, schoolId } = data;

    // 1. 创建 User
    const hashedPassword = await bcrypt.hash(
      String(password),
      await bcrypt.genSalt(10),
    );
    const user = this.userRepository.create({
      account,
      name,
      password: hashedPassword,
      phone: phone || account,
      role_id: String(role_id),
      sex,
      status: 1, // 启用
    });
    const savedUser = await this.userRepository.save(user);

    // 2. 创建 SchoolAdmin
    const schoolAdmin = this.schoolAdminRepository.create({
      school_id: schoolId,
      user_id: savedUser.id,
    });

    await this.schoolAdminRepository.save(schoolAdmin);
    return this.findOne(savedUser.id);
  }

  async update(userId: string, data: any) {
    const admin = await this.findOne(userId);
    if (data.user) {
      if (data.user.password) {
        data.user.password = await bcrypt.hash(
          String(data.user.password),
          await bcrypt.genSalt(10),
        );
      }
      data.user.update_time = String(Math.floor(Date.now() / 1000));
      await this.userRepository.update(admin.user_id, data.user);
      await this.schoolAdminRepository.update(
        admin.id,
        data.admin || data.school_admin || data,
      );
    } else {
      const userFields = this.userRepository.metadata.columns.map(
        (c) => c.propertyName,
      );
      const userData: any = {};
      const adminData: any = {};

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
          adminData[key] = data[key];
        }
      }
      if (Object.keys(userData).length > 0) {
        userData.update_time = now;
        await this.userRepository.update(admin.user_id, userData);
      }
      if (Object.keys(adminData).length > 0) {
        await this.schoolAdminRepository.update(admin.id, adminData);
      }
    }
    return this.findOne(userId);
  }

  async softDelete(userId: string) {
    const admin = await this.findOne(userId);
    await this.userRepository.update(admin.user_id, { status: 2 });
    return { success: true };
  }
}
