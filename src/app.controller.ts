import { UserService } from './modules/user/user.service';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Result } from '@/database/types/result.type';
import { Public } from '@/common/decorators/auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @Public()
  getHello(): Result {
    console.log('Hello World!');
    return Result.success(this.appService.getHello(), null);
  }
}
