import { UserService } from './modules/user/user.service';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Result } from '@/database/types/result.type';
import { Public } from '@/common/decorators/auth.decorator';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('通用')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @Public()
  @ApiOperation({ summary: '测试简单的 Hello World 接口' })
  getHello(): Result {
    console.log('Hello World!');
    return Result.success(this.appService.getHello(), null);
  }
}
