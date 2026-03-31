import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import {
  CurrentUserInfoDto,
  CurrentStudentInfoDto,
  CurrentTeacherInfoDto,
  CurrentUserProfile,
} from './dto/CurrentUserProfile.dto';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import {
  FilePathTemplate,
  getFileStoreRoot,
} from '@/common/utils/file-path.map';
import { UserProfileMap } from '@/common/utils/user-profile.map';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  login(): any {}

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
      'user.avatar',
      'user.phone',
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

  async getSelfProfileInfo(id: string): Promise<CurrentUserProfile> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const roles = await this.getUserRolesDetails(id);
    const roleIds = roles.map((role) => String(role.id));

    let teacherInfo: CurrentTeacherInfoDto | null = null;
    let studentInfo: CurrentStudentInfoDto | null = null;
    let schoolName = '';

    if (roleIds.includes(AdminRolesMap.teacher)) {
      const teacher = await this.dataSource.getRepository(Teacher).findOne({
        where: { user_id: id },
      });
      if (teacher) {
        const school = teacher.school_id
          ? await this.dataSource.getRepository(School).findOneBy({ id: teacher.school_id })
          : null;
        const teacherRest = { ...teacher } as CurrentTeacherInfoDto & { id?: string };
        delete teacherRest.id;
        teacherInfo = {
          ...teacherRest,
          school_name: school?.name || '',
        };
        schoolName = school?.name || schoolName;
      }
    }

    if (roleIds.includes(AdminRolesMap.student)) {
      const student = await this.dataSource.getRepository(Student).findOne({
        where: { user_id: id },
      });
      if (student) {
        const school = student.school_id
          ? await this.dataSource.getRepository(School).findOneBy({ id: student.school_id })
          : null;
        const studentRest = { ...student } as CurrentStudentInfoDto & { id?: string };
        delete studentRest.id;
        studentInfo = {
          ...studentRest,
          school_name: school?.name || '',
        };
        schoolName = school?.name || schoolName;
      }
    }

    const safeUser = { ...user } as CurrentUserInfoDto & {
      password?: string;
    };
    delete safeUser.password;
    return {
      user: safeUser,
      roles,
      teacherInfo,
      studentInfo,
      school_name: schoolName,
    };
  }

  async updateSelfBasic(
    userId: string,
    payload: { sex: boolean },
  ): Promise<{ userId: string; sex: boolean }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.sex = payload.sex;
    user.update_time = this.getNowUnixTimestamp();
    await this.usersRepository.save(user);
    return { userId, sex: user.sex };
  }

  async updateSelfPassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ updated: boolean }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('旧密码不正确');
    }

    user.password = await bcrypt.hash(
      String(newPassword),
      await bcrypt.genSalt(10),
    );
    user.update_time = this.getNowUnixTimestamp();
    await this.usersRepository.save(user);
    return { updated: true };
  }

  async updateSelfAvatar(
    userId: string,
    tempAvatarPath: string,
  ): Promise<{ avatar: string }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const normalizedPath = tempAvatarPath
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    if (
      normalizedPath.includes('..') ||
      !normalizedPath.startsWith(`${UserProfileMap.TEMP_AVATAR_PREFIX}/`)
    ) {
      throw new BadRequestException('头像临时路径非法');
    }

    const sourceAbsolutePath = path.join(getFileStoreRoot(), normalizedPath);
    if (!fs.existsSync(sourceAbsolutePath)) {
      throw new NotFoundException('临时头像文件不存在');
    }

    const avatarDir = FilePathTemplate.userAvatars();
    fs.mkdirSync(avatarDir, { recursive: true });
    const timestamp = new Date().getTime();
    const avatarRelativePath = `${UserProfileMap.USER_AVATAR_PREFIX}/${userId}-${timestamp}.png`;
    const avatarAbsolutePath = path.join(
      getFileStoreRoot(),
      avatarRelativePath,
    );

    this.removeOldAvatarIfExists(user.avatar);

    if (fs.existsSync(avatarAbsolutePath)) {
      fs.unlinkSync(avatarAbsolutePath);
    }

    this.moveFile(sourceAbsolutePath, avatarAbsolutePath);

    user.avatar = avatarRelativePath;
    user.update_time = this.getNowUnixTimestamp();
    await this.usersRepository.save(user);
    return { avatar: avatarRelativePath };
  }

  async updateSelfPhone(
    userId: string,
    newPhone: string,
    code?: string,
  ): Promise<{
    sent?: boolean;
    expireInSeconds?: number;
    updated?: boolean;
    phone?: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const redisKey = this.getPhoneUpdateCodeKey(userId, newPhone);
    if (!code) {
      const verificationCode = this.generatePhoneVerificationCode();
      await this.redis.set(
        redisKey,
        verificationCode,
        'EX',
        UserProfileMap.PHONE_CODE_TTL_SECONDS,
      );
      console.log(`[SMS-MOCK] phone=${newPhone}, code=${verificationCode}`);
      return {
        sent: true,
        expireInSeconds: UserProfileMap.PHONE_CODE_TTL_SECONDS,
      };
    }

    const cachedCode = await this.redis.get(redisKey);
    if (!cachedCode) {
      throw new BadRequestException('验证码不存在或已过期');
    }
    if (cachedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    const duplicatePhoneUser = await this.usersRepository.findOne({
      select: ['id'],
      where: { phone: newPhone },
    });
    if (duplicatePhoneUser && duplicatePhoneUser.id !== userId) {
      throw new ConflictException('手机号已被占用');
    }

    user.phone = newPhone;
    user.update_time = this.getNowUnixTimestamp();
    await this.usersRepository.save(user);
    await this.redis.del(redisKey);

    return {
      updated: true,
      phone: newPhone,
    };
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

  private getNowUnixTimestamp(): string {
    return String(Math.floor(Date.now() / 1000));
  }

  private generatePhoneVerificationCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private getPhoneUpdateCodeKey(userId: string, newPhone: string): string {
    return `${UserProfileMap.PHONE_CODE_PREFIX}:${userId}:${newPhone}`;
  }

  private moveFile(sourcePath: string, targetPath: string): void {
    try {
      fs.renameSync(sourcePath, targetPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EXDEV') {
        throw new BadRequestException('头像文件移动失败');
      }

      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);
    }
  }

  private removeOldAvatarIfExists(currentAvatarPath?: string): void {
    if (!currentAvatarPath) {
      return;
    }

    const normalizedPath = currentAvatarPath
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');

    if (
      normalizedPath.includes('..') ||
      !normalizedPath.startsWith(`${UserProfileMap.USER_AVATAR_PREFIX}/`)
    ) {
      return;
    }

    const oldAvatarAbsolutePath = path.join(getFileStoreRoot(), normalizedPath);
    try {
      fs.unlinkSync(oldAvatarAbsolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw new BadRequestException('旧头像删除失败');
      }
    }
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
