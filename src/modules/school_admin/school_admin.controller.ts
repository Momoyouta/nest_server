import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { SchoolAdminService } from '@/modules/school_admin/school_admin.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Result } from '../../database/types/result.type';
import { Role } from '../../common/decorators/role.decorator';
import { AdminRolesMap } from '../../common/utils/role.map';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';

@ApiTags('学校管理员管理')
@AdminAuth()
@Controller('school-admin')
export class SchoolAdminController {
  constructor(private readonly schoolAdminService: SchoolAdminService) {}

  @Get()
  @ApiOperation({ summary: '获取学校管理员列表' })
  async findAll(@Query() query: BaseQueryDto) {
    const data = await this.schoolAdminService.findAll(query);
    return Result.success('查询成功', data);
  }

  @Post()
  @Role(AdminRolesMap.root, AdminRolesMap.admin, AdminRolesMap.school_root)
  @ApiOperation({ summary: '新增学校管理员' })
  async create(@Body() body: any) {
    const res = await this.schoolAdminService.create(body);
    return Result.success('创建成功', res);
  }

  @Put(':id')
  @Role(AdminRolesMap.root, AdminRolesMap.admin, AdminRolesMap.school_root)
  @ApiOperation({ summary: '修改学校管理员信息' })
  async update(@Param('id') id: string, @Body() body: any) {
    const res = await this.schoolAdminService.update(id, body);
    return Result.success('更新成功', res);
  }

  @Delete(':id')
  @Role(AdminRolesMap.root, AdminRolesMap.admin, AdminRolesMap.school_root)
  @ApiOperation({ summary: '删除学校管理员' })
  async remove(@Param('id') id: string) {
    await this.schoolAdminService.softDelete(id);
    return Result.success('禁用成功', null);
  }
}
