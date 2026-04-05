import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuth } from '@/common/decorators/admin-auth.decorator';
import { Role } from '@/common/decorators/role.decorator';
import { AdminRolesMap } from '@/common/utils/role.map';
import { Result } from '@/database/types/result.type';
import { FileChunkAdminService } from '@/modules/file_admin/file_chunk_admin.service';
import {
  DeleteFileChunkDto,
  DeleteFileChunkResponseDto,
  FileChunkAdminListResponseDto,
  MoveFileChunkResponseDto,
  MoveFileChunkToSchoolDto,
  QueryFileChunkAdminDto,
  UpdateFileChunkFilenameDto,
  UpdateFileChunkFilenameResponseDto,
} from '@/modules/file_admin/dto/file_chunk_admin.dto';

@ApiTags('管理端文件管理')
@ApiBearerAuth('access_token')
@AdminAuth()
@Role(
  AdminRolesMap.root,
  AdminRolesMap.admin,
  AdminRolesMap.school_root,
  AdminRolesMap.school_admin,
)
@Controller('admin/fileChunk')
export class FileChunkAdminController {
  constructor(private readonly fileChunkAdminService: FileChunkAdminService) {}

  @Get('query')
  @ApiOperation({ summary: '管理端分页条件查询 file_chunk' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'id', required: false, type: String })
  @ApiQuery({ name: 'fileHash', required: false, type: String })
  @ApiQuery({ name: 'filename', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'merging', 'done', 'expired'],
  })
  @ApiQuery({ name: 'type', required: false, enum: [1, 2] })
  @ApiQuery({ name: 'creatorId', required: false, type: String })
  @ApiQuery({ name: 'schoolId', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createTime', 'updateTime', 'fileSize'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: FileChunkAdminListResponseDto,
  })
  async query(
    @Query() query: QueryFileChunkAdminDto,
  ): Promise<Result<FileChunkAdminListResponseDto>> {
    const data = await this.fileChunkAdminService.query(query);
    return Result.success('查询成功', data);
  }

  @Patch('updateFilename')
  @ApiOperation({ summary: '管理端更新文件名（仅更新 file_name）' })
  @ApiBody({ type: UpdateFileChunkFilenameDto })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateFileChunkFilenameResponseDto,
  })
  async updateFilename(
    @Body() body: UpdateFileChunkFilenameDto,
  ): Promise<Result<UpdateFileChunkFilenameResponseDto>> {
    const data = await this.fileChunkAdminService.updateFilename(body);
    return Result.success('更新成功', data);
  }

  @Delete('delete')
  @ApiOperation({ summary: '管理端删除文件记录（支持 force 强制清理）' })
  @ApiQuery({ name: 'id', required: true, type: String })
  @ApiQuery({ name: 'force', required: false, type: Boolean, example: false })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: DeleteFileChunkResponseDto,
  })
  async remove(
    @Query() query: DeleteFileChunkDto,
  ): Promise<Result<DeleteFileChunkResponseDto>> {
    const data = await this.fileChunkAdminService.remove(query);
    return Result.success('删除成功', data);
  }

  @Post('moveToSchool')
  @ApiOperation({ summary: '管理端迁移文件到学校资源库（仅 status=done）' })
  @ApiBody({ type: MoveFileChunkToSchoolDto })
  @ApiResponse({
    status: 200,
    description: '迁移成功',
    type: MoveFileChunkResponseDto,
  })
  async moveToSchool(
    @Body() body: MoveFileChunkToSchoolDto,
  ): Promise<Result<MoveFileChunkResponseDto>> {
    const data = await this.fileChunkAdminService.moveToSchool(body);
    return Result.success('迁移成功', data);
  }
}
