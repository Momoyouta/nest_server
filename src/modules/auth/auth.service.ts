import { User } from '@/database/entities/user.entity';
import { Role } from '@/database/entities/role.entity';
import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {JwtService} from "@nestjs/jwt";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository, In} from "typeorm";
import * as bcrypt from 'bcrypt';
import {RegisterUserDto} from "@/modules/auth/dto/RegisterUserDto.dto";
import {TokenPayloadDto} from "@/modules/auth/dto/TokenPayload.dto";
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
            }
        })
        if (!user) {
            throw new HttpException("该账号不存在", HttpStatus.BAD_REQUEST);
        }
        const cppwd = await this.comparePassword(pwd, user.password);
        if (!cppwd) {
            throw new HttpException("密码错误", HttpStatus.BAD_REQUEST);
        }
        return {
            token: await this.getToken(user)
        };
    }
    
    async register(registerUserDto:RegisterUserDto) {
        const { account, password } = registerUserDto;
        const user = await this.userRepository.findOne({
            select: {
                account: true,
            },
            where: {
                account: account,
            }
        })
        if (user) {
            throw new HttpException("该账号已存在", HttpStatus.BAD_REQUEST);
        }
        registerUserDto.id = User.generateId();
        registerUserDto.password = await this.hashPassword(password);
        await this.userRepository.save(registerUserDto);
        return {
            token: await this.getToken(Object.assign(new User(), registerUserDto))
        };
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
    
    async getToken(user: User) {
        const roles = await this.roleRepository.find({
            select: {nameEN: true},
            where: {
                id: In(user.role_id.split(','))
            }
        });
        const tokenPayload: TokenPayloadDto = {
            userId: user.id,
            roleIds: user.role_id,
            roles: roles.map(role => role.nameEN)
        };
        return await this.jwtService.signAsync(
            { ...tokenPayload }
        );
    }
}
