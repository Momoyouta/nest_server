import {Body, Controller, Get, HttpException, HttpStatus, Post, Query, Redirect, Req, UseFilters} from '@nestjs/common';
import { AppService } from './app.service';
import {AppDto} from "./dto/app.dto";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}
    
    @Get()
    getHello(): string {
        return this.appService.getHello();
    }
    
    @Get('cat')
    getCat(): string {
        return 'meow meow'
    }
    
    @Get('redirect')
    @Redirect('cat',302)
    redirectBaidu(){}  
    
    @Post('dto')
    async getDTO(@Body() appDto: AppDto) {
        console.log(appDto);
        return {status: 200, message: 'Hello World!'};
    }  
    
    @Get('query')
    async getQuery(@Query('id') id:number, @Query('name') name: string) {
        console.log(id+' '+name);
        return {status: 200, message: `Hello, ${name}`};
    } 

    @Get('err')
    async getErr() {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        // return {status: 200, message: 'Hello World!'};
    }
}
