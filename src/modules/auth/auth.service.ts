import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '@/modules/auth/dto/RegisterUserDto.dto';
import { TokenPayloadDto } from '@/modules/auth/dto/TokenPayload.dto';
import { BaseUserInfo } from '@/modules/auth/dto/AuthResponse.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async login(pwd: string, account: string) {
    const user = await this.userRepository.findOne({
      where: {
        account: account,
      },
    });
    if (!user) {
      throw new HttpException('该账号不存在', HttpStatus.BAD_REQUEST);
    }
    const cppwd = await this.comparePassword(pwd, user.password);
    if (!cppwd) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }
    return await this.generateAuthResponse(user);
  }

  async register(registerUserDto: RegisterUserDto) {
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
    await this.userRepository.save(registerUserDto);
    return await this.generateAuthResponse(
      Object.assign(new User(), registerUserDto),
    );
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

    return {
      token,
      baseUserInfo: {
        userId: user.id,
        userRoles: userRoles,
        userName: user.name,
      } as BaseUserInfo,
    };
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

      return {
        userId: payload.userId,
        userRoles: payload.roles,
        userName: user.name,
      };
    } catch (e) {
      throw new HttpException('token无效或已过期', HttpStatus.BAD_REQUEST);
    }
  }
}
