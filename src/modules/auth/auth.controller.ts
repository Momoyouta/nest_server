import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { Result } from '@/database/types/result.type';
import { RegisterUserDto } from '@/modules/auth/dto/RegisterUserDto.dto';
import { Public } from '@/common/decorators/auth.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // Added usage
import {
  JwtAuthResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from './dto/AuthResponse.dto';
import { Role } from '@/common/decorators/role.decorator';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  async login(@Body('pwd') pwd: string, @Body('account') account: string) {
    const res = await this.authService.login(pwd, account);
    return Result.success('登录成功', res);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
    type: RegisterResponseDto,
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    const res = await this.authService.register(registerUserDto);
    return Result.success('注册成功', res);
  }

  @Public()
  @Post('jwtAuth')
  @ApiOperation({ summary: 'JWT有效性校验' })
  @ApiResponse({
    status: 200,
    description: '校验成功',
    type: JwtAuthResponseDto,
  })
  async jwtAuth(@Body('accessToken') accessToken: string) {
    const baseUserInfo = await this.authService.verifyToken(accessToken);
    return Result.success('Token有效', { valid: true, baseUserInfo });
  }

  @Public()
  @Post('admin/login')
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  async adminLogin(@Body('pwd') pwd: string, @Body('account') account: string) {
    const res = await this.authService.adminLogin(pwd, account);
    return Result.success('登录成功', res);
  }

  @Public()
  @Post('admin/register')
  @ApiOperation({ summary: '管理员注册' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
    type: RegisterResponseDto,
  })
  async adminRegister(@Body() registerUserDto: RegisterUserDto) {
    const res = await this.authService.adminRegister(registerUserDto);
    return Result.success('注册成功', res);
  }

  @Public()
  @Post('admin/jwtAuth')
  @ApiOperation({ summary: '管理员JWT有效性校验' })
  @ApiResponse({
    status: 200,
    description: '校验成功',
    type: JwtAuthResponseDto,
  })
  async adminJwtAuth(@Body('accessToken') accessToken: string) {
    const baseUserInfo = await this.authService.adminVerifyToken(accessToken);
    return Result.success('Token有效', { valid: true, baseUserInfo });
  }
}
