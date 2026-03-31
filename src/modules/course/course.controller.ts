import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRoles } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import {
  CourseDeleteParamDto,
  CourseListQueryDto,
  CourseListResponseDto,
  CreateCourseDto,
  CreateCourseResponseDto,
  DeleteCourseResponseDto,
  UpdateCourseDto,
  UpdateCourseResponseDto,
} from '@/modules/course/dto/CourseAdmin.dto';
import { CourseService } from '@/modules/course/course.service';

@ApiTags('课程管理')
@ApiBearerAuth('access_token')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('createCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员创建课程' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: CreateCourseResponseDto,
  })
  async createCourseAdmin(@Body() payload: CreateCourseDto) {
    const data = await this.courseService.createCourseAdmin(payload);
    return Result.success('创建成功', data);
  }

  @Put('updateCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员更新课程' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateCourseResponseDto,
  })
  async updateCourseAdmin(@Body() payload: UpdateCourseDto) {
    const data = await this.courseService.updateCourseAdmin(payload);
    return Result.success('更新成功', data);
  }

  @Delete('hardDeleteCourseAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员硬删除课程并清理关联数据' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteCourseResponseDto,
  })
  async hardDeleteCourseAdmin(@Param() params: CourseDeleteParamDto) {
    const data = await this.courseService.hardDeleteCourseAdmin(params.id);
    return Result.success('删除成功', data);
  }

  @Put('softDeleteCourseAdmin/:id')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员软删除课程(改为未发布)' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteCourseResponseDto,
  })
  async softDeleteCourseAdmin(@Param() params: CourseDeleteParamDto) {
    const data = await this.courseService.softDeleteCourseAdmin(params.id);
    return Result.success('删除成功', data);
  }

  @Get('listCourseAdmin')
  @AdminAuth()
  @Role(...AdminRoles)
  @ApiOperation({ summary: '管理员分页查询课程列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: CourseListResponseDto,
  })
  async listCourseAdmin(@Query() query: CourseListQueryDto) {
    const data = await this.courseService.listCourseAdmin(query);
    return Result.success('查询成功', data);
  }
}
