import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CollegeService } from './college.service';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BaseQueryDto } from '@/common/dto/base-query.dto';
import { Result } from '@/database/types/result.type';

@ApiTags('学院管理 (管理端)')
@ApiBearerAuth()
@AdminAuth()
@Controller('college')
export class CollegeController {
  constructor(private readonly collegeService: CollegeService) {}

  @Post()
  @ApiOperation({ summary: '创建学院' })
  async create(@Body() createCollegeDto: any) {
    const res = await this.collegeService.create(createCollegeDto);
    return Result.success('创建成功', res);
  }

  @Get()
  @ApiOperation({ summary: '获取学院列表' })
  async findAll(@Query() query: BaseQueryDto) {
    const res = await this.collegeService.findAll(query);
    return Result.success('查询成功', res);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学院详情' })
  async findOne(@Param('id') id: string) {
    const res = await this.collegeService.findOne(id);
    return Result.success('查询成功', res);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新学院' })
  async update(@Param('id') id: string, @Body() updateCollegeDto: any) {
    const res = await this.collegeService.update(id, updateCollegeDto);
    return Result.success('更新成功', res);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除学院' })
  async remove(@Param('id') id: string) {
    await this.collegeService.remove(id);
    return Result.success('删除成功', null);
  }
}
