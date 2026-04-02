import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/CreateSchoolDto.dto';
import { UpdateSchoolDto } from './dto/UpdateSchoolDto.dto';
import { QuerySchoolDto } from './dto/QuerySchoolDto.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { Result } from '@/database/types/result.type';
import { School } from '@/database/entities/school.entity';
import { PlatformAdminRoles } from '@/common/utils/role.map';
import { Public } from '@/common/decorators/auth.decorator';
import { ApplySchoolDto } from './dto/ApplySchoolDto.dto';
import { SchoolApplication } from '@/database/entities/school_application.entity';
import { QuerySchoolApplicationDto } from './dto/QuerySchoolApplicationDto.dto';
import { ReviewSchoolApplicationDto } from './dto/ReviewSchoolApplicationDto.dto';

@ApiTags('学校管理')
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('create')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '创建学校' })
  @ApiResponse({ status: 201, type: School })
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    const school = await this.schoolService.create(createSchoolDto);
    return Result.success('创建成功', school);
  }

  @Post('applySchool')
  @Public()
  @ApiOperation({ summary: '学校申请' })
  @ApiResponse({ status: 201, type: SchoolApplication })
  async applySchool(@Body() applySchoolDto: ApplySchoolDto) {
    const application = await this.schoolService.applySchool(applySchoolDto);
    return Result.success('申请成功', application);
  }

  @Get('applications')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '分页获取学校申请记录' })
  @ApiResponse({ status: 200, description: '成功返回申请记录列表与总数' })
  async findAllApplications(@Query() query: QuerySchoolApplicationDto) {
    const { list, total } = await this.schoolService.findAllApplications(query);
    return Result.success('查询成功', { list, total });
  }

  @Put('applications/:id/review')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '审批学校申请(平台管理员)' })
  @ApiResponse({ status: 200, type: SchoolApplication })
  async reviewApplication(
    @Param('id') id: string,
    @Body() reviewDto: ReviewSchoolApplicationDto,
  ) {
    const application = await this.schoolService.reviewApplication(
      id,
      reviewDto,
    );
    return Result.success('审批成功', application);
  }

  @Get()
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '分页获取学校列表' })
  @ApiResponse({ status: 200, description: '成功返回学校列表与总数' })
  async findAll(@Query() query: QuerySchoolDto) {
    const { list, total } = await this.schoolService.findAll(query);
    return Result.success('查询成功', { list, total });
  }

  @Get(':id')
  @AdminAuth()
  @ApiOperation({ summary: '获取学校详情' })
  @ApiResponse({ status: 200, type: School })
  async findOne(@Param('id') id: string) {
    const school = await this.schoolService.findOne(id);
    return Result.success('查询成功', school);
  }

  @Put(':id')
  @AdminAuth()
  @Role(...PlatformAdminRoles, 'school_root')
  @ApiOperation({ summary: '更新学校信息' })
  @ApiResponse({ status: 200, type: School })
  async update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    const school = await this.schoolService.update(id, updateSchoolDto);
    return Result.success('更新成功', school);
  }

  @Delete(':id')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '禁用学校 (软删除)' })
  @ApiResponse({ status: 200, description: '禁用成功' })
  async remove(@Param('id') id: string) {
    const result = await this.schoolService.softDelete(id);
    return Result.success(result.message, null);
  }

  @Delete('/removeHard/:id')
  @AdminAuth()
  @Role(...PlatformAdminRoles)
  @ApiOperation({ summary: '禁用学校 (硬删除)' })
  @ApiResponse({ status: 200, description: '禁用成功' })
  async removeHard(@Param('id') id: string) {
    const result = await this.schoolService.remove(id);
    return Result.success(result.message, null);
  }
}
