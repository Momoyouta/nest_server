import {Controller, Get, Param, Query} from "@nestjs/common";
import {UserService} from "./user.service";
import {Result} from "@/database/types/result.type";

@Controller('user')
export class UserController {
    
    constructor(private readonly userService: UserService) {}
    
    @Get('hello')
    public hello() {
        return this.userService.getHello();
    }
    
    @Get('findByIdOne/:id')
    public async getUser(@Param('id') id: string) {
        return this.userService.getUser(id);
    }
    
    @Get('getUserRole')
    public async getUserRole(@Query('id') id: string) {
        const userRoles = await this.userService.getUserRole(id);
        return Result.success('获取成功', userRoles);
    }
}