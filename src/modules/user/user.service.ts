import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { Student } from '@/database/entities/student.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { School } from '@/database/entities/school.entity';
import { AdminRolesMap } from '@/common/utils/role.map';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { console } from 'inspector';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) { }

  login(): any { }

  async findAll(query: BaseQueryDto) {
    const { page = 1, pageSize = 10, id, name, account, phone, role_id } = query as any;
    const qb = this.usersRepository.createQueryBuilder('user');

    qb.select([
      'user.id',
      'user.name',
      'user.role_id',
      'user.sex',
      'user.account',
      'user.create_time',
      'user.update_time',
      'user.status',
    ]);

    if (id) {
      qb.andWhere('user.id = :id', { id });
    }
    if (name) {
      qb.andWhere('user.name LIKE :name', { name: `%${name}%` });
    }
    if (account || phone) {
      const searchAccount = account || phone;
      qb.andWhere('user.account LIKE :account', { account: `%${searchAccount}%` });
    }
    if (role_id) {
      qb.andWhere('FIND_IN_SET(:role_id, user.role_id) > 0', { role_id });
    }

    qb.skip((page - 1) * pageSize).take(pageSize);
    qb.orderBy('user.create_time', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const allRoles = await this.roleRepository.find();
    const roleMap = new Map(allRoles.map(r => [String(r.id), r.nameCN]));
    const userIds = list.map(u => u.id);
    let studentSchools: Student[] = [];
    let teacherSchools: Teacher[] = [];
    let adminSchools: SchoolAdmin[] = [];

    if (userIds.length > 0) {
      studentSchools = await this.dataSource.getRepository(Student).find({ where: { user_id: In(userIds) } });
      teacherSchools = await this.dataSource.getRepository(Teacher).find({ where: { user_id: In(userIds) } });
      adminSchools = await this.dataSource.getRepository(SchoolAdmin).find({ where: { user_id: In(userIds) } });
    }
    const allSchools = await this.dataSource.getRepository(School).find();
    const schoolMap = new Map(allSchools.map(s => [String(s.id), s.name]));

    const resultList = list.map(user => {
      const userRoleIds = user.role_id ? user.role_id.split(',') : [];
      const roleNames = userRoleIds.map(rid => roleMap.get(rid) || rid).join(',');

      const userSchoolNames = new Set<string>();

      if (userRoleIds.includes(AdminRolesMap.root) || userRoleIds.includes(AdminRolesMap.admin)) {
        userSchoolNames.add('平台');
      }

      studentSchools.filter(s => s.user_id === user.id).forEach(s => {
        if (s.school_id) {
          const name = schoolMap.get(String(s.school_id));
          if (name) userSchoolNames.add(name);
        }
      });
      teacherSchools.filter(t => t.user_id === user.id).forEach(t => {
        if (t.school_id) {
          const name = schoolMap.get(String(t.school_id));
          if (name) userSchoolNames.add(name);
        }
      });
      adminSchools.filter(a => a.user_id === user.id).forEach(a => {
        if (a.school_id) {
          const name = schoolMap.get(String(a.school_id));
          if (name) userSchoolNames.add(name);
        }
      });

      return {
        ...user,
        roleNames: roleNames,
        organization: Array.from(userSchoolNames).join(',') || '无'
      };
    });

    return { list: resultList, total };
  }

  async getUser(id: string): Promise<{ code: number; user: User | null }> {
    return await this.usersRepository
      .findOneBy({ id })
      .then((user) => {
        return { code: 200, user: user };
      })
      .catch((err) => {
        console.log(err);
        throw new Error('server error');
      });
  }

  /**
   * 创建用户
   */
  async createUser(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return await this.usersRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(String(data.password), await bcrypt.genSalt(10));
    }
    data.update_time = String(Math.floor(Date.now() / 1000));
    const result = await this.usersRepository.update(id, data);
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    const updatedUser = await this.usersRepository.findOneBy({ id });
    if (!updatedUser) {
      throw new NotFoundException('用户不存在');
    }
    return updatedUser;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<{ code: number; message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    return { code: 200, message: '删除成功' };
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getUserRole(id: string): Promise<Role[]> {
    return this.getUserRolesDetails(id);
  }

  async getUserRolesDetails(id: string): Promise<Role[]> {
    const user = await this.usersRepository.findOne({
      select: ['role_id'],
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (!user.role_id) {
      return [];
    }
    const roleIds = user.role_id.split(',').filter((id) => id.trim() !== '');
    if (roleIds.length === 0) {
      return [];
    }
    return await this.roleRepository.findBy({
      id: In(roleIds),
    });
  }

  async updateUserRoles(
    id: string,
    roleIds: string[],
  ): Promise<{ code: number; message: string }> {
    const roleIdStr = roleIds.join(',');
    const result = await this.usersRepository.update(id, {
      role_id: roleIdStr,
    });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    return { code: 200, message: '更新成功' };
  }

  /**
   * 创建教师（包含用户基础信息）
   */
  async createTeacherWithUser(userData: Partial<User>, schoolId: string): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. 创建用户
      if (userData.password) {
        userData.password = await bcrypt.hash(String(userData.password), await bcrypt.genSalt(10));
      }
      const now = String(Math.floor(Date.now() / 1000));
      userData.create_time = now;
      userData.update_time = now;
      userData.role_id = AdminRolesMap.teacher;
      userData.status = 1;

      const user = manager.create(User, userData);
      const savedUser = await manager.save(User, user);

      // 2. 创建教师实体
      const teacher = manager.create(Teacher, {
        user_id: savedUser.id,
        school_id: schoolId,
      });
      await manager.save(Teacher, teacher);

      return savedUser;
    });
  }

  /**
   * 创建学生（包含用户基础信息）
   */
  async createStudentWithUser(
    userData: Partial<User>,
    schoolId: string,
    grade?: string,
    classId?: string,
  ): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. 创建用户
      if (userData.password) {
        userData.password = await bcrypt.hash(String(userData.password), await bcrypt.genSalt(10));
      }
      const now = String(Math.floor(Date.now() / 1000));
      userData.create_time = now;
      userData.update_time = now;
      userData.role_id = AdminRolesMap.student;
      userData.status = 1;

      const user = manager.create(User, userData);
      const savedUser = await manager.save(User, user);

      // 2. 创建学生实体
      const student = manager.create(Student, {
        user_id: savedUser.id,
        school_id: schoolId,
        grade_id: grade,
        class_id: classId,
      });
      await manager.save(Student, student);

      return savedUser;
    });
  }
}
