import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { AdminRoles, AdminRolesMap } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { CourseMaterialService } from '@/modules/course/course-material.service';
import {
  BindMaterialDto,
  ListMaterialQueryDto,
  UpdateMaterialDto,
  DeleteMaterialDto,
  ListMaterialResponseDto,
} from './dto/course-material.dto';
import { AllJwtAuth } from '@/common/decorators/auth.decorator';
import { Role } from '@/common/decorators/role.decorator';

@ApiTags('课程资料管理')
@ApiExtraModels(ListMaterialResponseDto)
@Controller('course/material')
@AllJwtAuth()
export class CourseMaterialController {
  constructor(private readonly materialService: CourseMaterialService) { }

  @Post('bind')
  @Role(...AdminRoles, AdminRolesMap.teacher)
  @ApiOperation({ summary: '绑定/上传课程资料' })
  @ApiResponse({ status: 201, description: '绑定成功' })
  async bindMaterial(@Body() dto: BindMaterialDto): Promise<Result<{ id: string, bound: boolean }>> {
    const res = await this.materialService.bindMaterial(dto);
    return Result.success('绑定成功', res);
  }

  @Get('list')
  @ApiOperation({ summary: '查询课程资料列表' })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(Result) },
        {
          properties: {
            data: { $ref: getSchemaPath(ListMaterialResponseDto) },
          },
        },
      ],
    },
  })
  async listMaterials(@Query() query: ListMaterialQueryDto): Promise<Result<ListMaterialResponseDto>> {
    const res = await this.materialService.listMaterials(query);
    return Result.success('查询成功', res);
  }

  @Post('update')
  @Role(...AdminRoles, AdminRolesMap.teacher)
  @ApiOperation({ summary: '修改资料文件名' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateMaterial(@Body() dto: UpdateMaterialDto): Promise<Result<{ id: string, updated: boolean }>> {
    const res = await this.materialService.updateMaterialName(dto);
    return Result.success('更新成功', res);
  }

  @Post('delete')
  @Role(...AdminRoles, AdminRolesMap.teacher)
  @ApiOperation({ summary: '删除资料' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteMaterial(@Body() dto: DeleteMaterialDto): Promise<Result<{ id: string, deleted: boolean }>> {
    const res = await this.materialService.deleteMaterial(dto);
    return Result.success('删除成功', res);
  }
}
