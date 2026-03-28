import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '@/modules/auth/dto/RegisterUserDto.dto';
import { TokenPayloadDto } from '@/modules/auth/dto/TokenPayload.dto';
import { BaseUserInfo } from '@/modules/auth/dto/BaseUserInfo.dto';
import { AdminRoleValues, AdminRolesMap } from '@/common/utils/role.map';
import { DataSource } from 'typeorm';
import { Student } from '@/database/entities/student.entity';
import { Teacher } from '@/database/entities/teacher.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { InvitationService } from '../invitation/invitation.service';
import { UserService } from '../user/user.service';
import { CurrentUserProfile } from '../user/dto/CurrentUserProfile.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly invitationService: InvitationService,
    private readonly userService: UserService,
  ) { }

  async login(pwd: string, account: string) {
    const user = await this.userRepository.findOne({
      where: {
        account: account,
      },
    });
    if (!user) {
      throw new HttpException('该账号不存在', HttpStatus.BAD_REQUEST);
    }
    if (user.status !== 1) {
      throw new HttpException('账号封禁中', HttpStatus.FORBIDDEN);
    }
    const cppwd = await this.comparePassword(pwd, user.password);
    if (!cppwd) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }
    return await this.generateAuthResponse(user);
  }

  async register(registerUserDto: RegisterUserDto) {
    const { account, inviteCode, role_id } = registerUserDto;

    // 1. 验证角色 (仅允许教师和学生)
    if (role_id !== AdminRolesMap.teacher && role_id !== AdminRolesMap.student) {
      throw new HttpException('该接口仅允许注册教师或学生', HttpStatus.BAD_REQUEST);
    }

    // 2. 账号唯一性检查
    const user = await this.userRepository.findOne({
      select: {
        account: true,
      },
      where: {
        account: account,
      },
    });
    if (user) {
      throw new HttpException('该账号已存在', HttpStatus.BAD_REQUEST);
    }
    registerUserDto.phone = registerUserDto.account;

    // 3. 校验邀请码
    const inviteData = await this.invitationService.getInviteData(inviteCode);
    if (!inviteData) {
      throw new HttpException('邀请码不存在或已过期', HttpStatus.BAD_REQUEST);
    }

    // 4. 校验邀请码类型与请求角色是否匹配 (0:老师, 1:学生)
    if (role_id === AdminRolesMap.teacher && inviteData.type !== 0) {
      throw new HttpException('邀请码类型与教师角色不匹配', HttpStatus.BAD_REQUEST);
    }
    if (role_id === AdminRolesMap.student && inviteData.type !== 1) {
      throw new HttpException('邀请码类型与学生角色不匹配', HttpStatus.BAD_REQUEST);
    }

    // 5. 调用 UserService 进行创建
    let savedUser: User;
    if (role_id === AdminRolesMap.teacher) {
      savedUser = await this.userService.createTeacherWithUser(
        registerUserDto,
        inviteData.school_id,
      );
    } else {
      savedUser = await this.userService.createStudentWithUser(
        registerUserDto,
        inviteData.school_id,
        inviteData.grade,
        inviteData.class_id,
      );
    }

    return await this.generateAuthResponse(savedUser);
  }

  /**
   * 哈希化密码
   * @param pwd
   */
  async hashPassword(pwd: string) {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(pwd, salt);
  }

  /**
   * 验证密码
   * @param pwd
   * @param hash
   */
  async comparePassword(pwd: string, hash: string) {
    return bcrypt.compare(pwd, hash);
  }

  async generateAuthResponse(user: User) {
    const roles = await this.roleRepository.find({
      select: { nameEN: true },
      where: {
        id: In(user.role_id.split(',')),
      },
    });
    const userRoles = roles.map((role) => role.nameEN);

    const tokenPayload: TokenPayloadDto = {
      userId: user.id,
      roleIds: user.role_id,
      roles: userRoles,
    };
    const token = await this.jwtService.signAsync({ ...tokenPayload });
    const userProfile = await this.userService.getSelfProfileInfo(user.id);

    return {
      token,
      userProfile,
    };
  }

  async verifyTokenWithProfile(token: string): Promise<CurrentUserProfile> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayloadDto>(token);
      return await this.userService.getSelfProfileInfo(String(payload.userId));
    } catch {
      throw new HttpException('token无效或已过期', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * 校验token
   * @param token
   */
  async verifyToken(token: string): Promise<BaseUserInfo> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Fetch user name to complete baseUserInfo
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        select: { name: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let schoolId: string | undefined = undefined;
      const roleIdArr = payload.roleIds ? payload.roleIds.split(',') : [];
      if (roleIdArr.includes(AdminRolesMap.student)) {
        const student = await this.dataSource.getRepository(Student).findOne({ where: { user_id: payload.userId } });
        if (student?.school_id) schoolId = String(student.school_id);
      } else if (roleIdArr.includes(AdminRolesMap.teacher)) {
        const teacher = await this.dataSource.getRepository(Teacher).findOne({ where: { user_id: payload.userId } });
        if (teacher?.school_id) schoolId = String(teacher.school_id);
      } else if (roleIdArr.includes(AdminRolesMap.school_admin) || roleIdArr.includes(AdminRolesMap.school_root)) {
        const schoolAdmin = await this.dataSource.getRepository(SchoolAdmin).findOne({ where: { user_id: payload.userId } });
        if (schoolAdmin?.school_id) schoolId = String(schoolAdmin.school_id);
      }

      return {
        userId: payload.userId,
        userRoles: payload.roles,
        userName: user.name,
        schoolId: schoolId,
      };
    } catch (e) {
      throw new HttpException('token无效或已过期', HttpStatus.BAD_REQUEST);
    }
  }

  async adminLogin(pwd: string, account: string) {
    const user = await this.userRepository.findOne({
      where: {
        account: account,
      },
    });
    if (!user) {
      throw new HttpException('该账号不存在', HttpStatus.BAD_REQUEST);
    }
    if (user.status !== 1) {
      throw new HttpException('账号封禁中', HttpStatus.FORBIDDEN);
    }
    const cppwd = await this.comparePassword(pwd, user.password);
    if (!cppwd) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    const userRoleIds = user.role_id ? user.role_id.split(',') : [];
    const hasAdminRole = userRoleIds.some((roleId) =>
      AdminRoleValues.includes(roleId),
    );
    if (!hasAdminRole) {
      throw new HttpException('该账号无管理员权限', HttpStatus.FORBIDDEN);
    }

    return await this.generateAdminAuthResponse(user);
  }

  async adminRegister(registerUserDto: RegisterUserDto) {
    const { account, password } = registerUserDto;
    const user = await this.userRepository.findOne({
      select: {
        account: true,
      },
      where: {
        account: account,
      },
    });
    if (user) {
      throw new HttpException('该账号已存在', HttpStatus.BAD_REQUEST);
    }
    registerUserDto.id = User.generateId();
    registerUserDto.password = await this.hashPassword(password);
    registerUserDto.phone = registerUserDto.account;
    registerUserDto.status = 2;
    const now = String(Math.floor(Date.now() / 1000));
    (registerUserDto as any).create_time = now;
    (registerUserDto as any).update_time = now;
    await this.userRepository.save(registerUserDto);
    return await this.generateAdminAuthResponse(
      Object.assign(new User(), registerUserDto),
    );
  }

  async generateAdminAuthResponse(user: User) {
    const roles = await this.roleRepository.find({
      select: { nameEN: true },
      where: {
        id: In(user.role_id.split(',')),
      },
    });
    const userRoles = roles.map((role) => role.nameEN);

    const tokenPayload: TokenPayloadDto = {
      userId: user.id,
      roleIds: user.role_id,
      roles: userRoles,
    };
    const token = await this.jwtService.signAsync(
      { ...tokenPayload },
      {
        secret: process.env.ADMIN_JWT_SECRET || 'nest_admin_secret',
        expiresIn: '1d',
        algorithm: 'HS256',
      },
    );

    let schoolId: string | undefined = undefined;
    const roleIdArr = user.role_id ? user.role_id.split(',') : [];
    if (roleIdArr.includes(AdminRolesMap.student)) {
      const student = await this.dataSource.getRepository(Student).findOne({ where: { user_id: user.id } });
      if (student?.school_id) schoolId = String(student.school_id);
    } else if (roleIdArr.includes(AdminRolesMap.teacher)) {
      const teacher = await this.dataSource.getRepository(Teacher).findOne({ where: { user_id: user.id } });
      if (teacher?.school_id) schoolId = String(teacher.school_id);
    } else if (roleIdArr.includes(AdminRolesMap.school_admin) || roleIdArr.includes(AdminRolesMap.school_root)) {
      const schoolAdmin = await this.dataSource.getRepository(SchoolAdmin).findOne({ where: { user_id: user.id } });
      if (schoolAdmin?.school_id) schoolId = String(schoolAdmin.school_id);
    }

    return {
      token,
      baseUserInfo: {
        userId: user.id,
        userRoles: userRoles,
        userName: user.name,
        schoolId: schoolId,
      } as BaseUserInfo,
    };
  }

  async adminVerifyToken(token: string): Promise<BaseUserInfo> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ADMIN_JWT_SECRET || 'nest_admin_secret',
        algorithms: ['HS256'],
      });
      // Fetch user name to complete baseUserInfo
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
        select: { name: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let schoolId: string | undefined = undefined;
      const roleIdArr = payload.roleIds ? payload.roleIds.split(',') : [];
      if (roleIdArr.includes(AdminRolesMap.student)) {
        const student = await this.dataSource.getRepository(Student).findOne({ where: { user_id: payload.userId } });
        if (student?.school_id) schoolId = String(student.school_id);
      } else if (roleIdArr.includes(AdminRolesMap.teacher)) {
        const teacher = await this.dataSource.getRepository(Teacher).findOne({ where: { user_id: payload.userId } });
        if (teacher?.school_id) schoolId = String(teacher.school_id);
      } else if (roleIdArr.includes(AdminRolesMap.school_admin) || roleIdArr.includes(AdminRolesMap.school_root)) {
        const schoolAdmin = await this.dataSource.getRepository(SchoolAdmin).findOne({ where: { user_id: payload.userId } });
        if (schoolAdmin?.school_id) schoolId = String(schoolAdmin.school_id);
      }

      return {
        userId: payload.userId,
        userRoles: payload.roles,
        userName: user.name,
        schoolId: schoolId,
      };
    } catch (e) {
      throw new HttpException('管理员token无效或已过期', HttpStatus.BAD_REQUEST);
    }
  }

  async validateTokenForFile(token: string): Promise<BaseUserInfo> {
    try {
      // 先验证普通用户的
      return await this.verifyToken(token);
    } catch (e) {
      try {
        // 再验证管理员的
        return await this.adminVerifyToken(token);
      } catch (e2) {
        throw new HttpException('鉴权失败', HttpStatus.UNAUTHORIZED);
      }
    }
  }
}
