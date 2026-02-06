import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  UseFilters,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AppDto } from './dto/app.dto';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { Result } from '@/database/types/result.type';
import { Public } from '@/common/decorators/auth.decorator';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { DataSource, Repository } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly alsService: AsyncLocalstorageService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('cat')
  getCat(): string {
    return 'meow meow';
  }

  @Get('redirect')
  @Redirect('cat', 302)
  redirectBaidu() {}

  @Post('dto')
  async getDTO(@Body() appDto: AppDto) {
    console.log(appDto);
    return { status: 200, message: 'Hello World!' };
  }

  @Get('query')
  async getQuery(@Query('id') id: number, @Query('name') name: string) {
    console.log(id + ' ' + name);
    return { status: 200, message: `Hello, ${name}` };
  }

  @Get('err')
  async getErr() {
    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    // return {status: 200, message: 'Hello World!'};
  }

  @Get('alsTest')
  @Public()
  async alsTest() {
    const context = this.alsService.getStore();
    console.log('context: ', context);
    return Result.success('success', context);
  }

  @Get('absAddTest')
  @Public()
  async absAddTest() {
    await this.dataSource.manager.transaction(async (tsManager) => {
      const userRepository = tsManager.getRepository(User);
      const user = await userRepository.findOneById('1');
      if (user)
        await userRepository.update('1', { count: user.count + 1 });
    });
  }
}
