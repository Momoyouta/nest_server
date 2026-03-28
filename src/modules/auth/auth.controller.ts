import {
  Body,
  Controller,
  Post,
  Get,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { Result } from '@/database/types/result.type';
import { RegisterUserDto } from '@/modules/auth/dto/RegisterUserDto.dto';
import { Public } from '@/common/decorators/auth.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'; // Added usage
import {
  LoginResponseDto,
  RegisterResponseDto,
  JwtAuthResponseDto,
  UserLoginResponseDto,
  UserRegisterResponseDto,
  UserJwtAuthResponseDto,
} from './dto/AuthResponse.dto';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录-用户端' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: UserLoginResponseDto,
  })
  async login(@Body('pwd') pwd: string, @Body('account') account: string) {
    const res = await this.authService.login(pwd, account);
    return Result.success('登录成功', res);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册-用户端' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
    type: UserRegisterResponseDto,
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    const res = await this.authService.register(registerUserDto);
    return Result.success('注册成功', res);
  }

  @Public()
  @Post('jwtAuth')
  @ApiOperation({ summary: 'JWT有效性校验-用户端' })
  @ApiResponse({
    status: 200,
    description: '校验成功',
    type: UserJwtAuthResponseDto,
  })
  async jwtAuth(@Body('accessToken') accessToken: string) {
    const userProfile =
      await this.authService.verifyTokenWithProfile(accessToken);
    return Result.success('Token有效', { valid: true, userProfile });
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

  @Public()
  @Get('checkFilePermission')
  @ApiOperation({ summary: '静态资源鉴权 (Nginx auth_request)' })
  @ApiResponse({ status: 200, description: '鉴权成功' })
  @ApiResponse({ status: 401, description: '鉴权失败' })
  async checkFilePermission(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new HttpException('未提供认证信息', HttpStatus.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new HttpException('认证格式错误', HttpStatus.UNAUTHORIZED);
    }
    await this.authService.validateTokenForFile(token);
    return Result.success('鉴权通过', null);
  }
}
