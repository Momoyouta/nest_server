import {Body, Controller, Post} from '@nestjs/common';
import {AuthService} from "@/modules/auth/auth.service";
import {Result} from "@/database/types/result.type";
import {RegisterUserDto} from "@/modules/auth/dto/RegisterUserDto.dto";
import {Public} from "@/common/decorators/auth.decorator";

@Controller('auth')
export class AuthController {
    
    constructor(private readonly authService: AuthService) {}
    @Public()
    @Post('login')
    async login(@Body('pwd') pwd: string, @Body('account') account: string) {
        const res = await this.authService.login(pwd, account);
        return Result.success('登录成功', res);
    }
    @Public()
    @Post('register')
    async register(@Body() registerUserDto: RegisterUserDto) {
        const res = await this.authService.register(registerUserDto);
        return Result.success('注册成功', res);
    }
    
}
