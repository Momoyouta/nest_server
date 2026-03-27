import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@/common/decorators/role.decorator';
import { UploadService } from './upload/upload.service';
import { ChunkService } from './chunk/chunk.service';
import { StorageService } from './storage/storage.service';
import { CleanupTask } from './tasks/cleanup.task';
import { UploadImageDto } from './upload/dto/upload-image.dto';
import { InitChunkDto } from './chunk/dto/init-chunk.dto';
import { UploadChunkDto } from './chunk/dto/upload-chunk.dto';
import { MergeChunkDto } from './chunk/dto/merge-chunk.dto';
import { CreateSchoolDirDto } from './storage/dto/create-school-dir.dto';
import { CreateCourseDirDto } from './storage/dto/create-course-dir.dto';
import { CreateChapterLessonDirDto } from './storage/dto/create-chapter-lesson-dir.dto';
import { CreateHomeworkDirDto } from './storage/dto/create-homework-dir.dto';


@ApiTags('文件管理')
@Controller('file')
export class FileController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly chunkService: ChunkService,
    private readonly storageService: StorageService,
    private readonly cleanupTask: CleanupTask,
  ) { }

  // ===== 小文件上传 =====
  @Post('upload/image')
  @ApiOperation({ summary: '上传图片（<5MB）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'target'],
      properties: {
        file: { type: 'string', format: 'binary', description: '图片文件' },
        target: { type: 'string', description: '目标目录相对路径', example: 'schools/1/avatars' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '上传成功，返回存储相对路径' })
  @ApiResponse({ status: 413, description: '文件大小超过 5MB 限制' })
  @ApiResponse({ status: 415, description: '不支持的文件类型' })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadImageDto,
  ) {
    const result = this.uploadService.saveImage(file, dto.target);
    return { code: 200, msg: '上传成功', data: result };
  }

  // ===== 分片上传 =====

  @Post('chunk/init')
  @ApiOperation({ summary: '初始化分片上传（支持断点续传）' })
  @ApiResponse({ status: 200, description: '初始化成功，返回uploadId和已上传分片列表' })
  async initChunkUpload(@Body() dto: InitChunkDto) {
    const data = await this.chunkService.initUpload(dto);
    return { code: 200, msg: '初始化成功', data };
  }

  @Post('chunk/upload')
  @ApiOperation({ summary: '上传单个分片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'uploadId', 'chunkIndex'],
      properties: {
        file: { type: 'string', format: 'binary', description: '分片文件' },
        uploadId: { type: 'string', description: '上传任务ID' },
        chunkIndex: { type: 'number', description: '分片索引（从0开始）' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '分片上传成功' })
  @ApiResponse({ status: 404, description: '上传任务不存在' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadChunkDto,
  ) {
    const data = await this.chunkService.uploadChunk(dto, file);
    return { code: 200, msg: '分片上传成功', data };
  }

  @Get('chunk/progress/:fileHash')
  @ApiOperation({ summary: '查询分片上传进度' })
  @ApiParam({ name: 'fileHash', description: '文件SHA-256哈希值' })
  @ApiResponse({ status: 200, description: '返回已上传分片列表和任务状态' })
  @ApiResponse({ status: 404, description: '未找到上传任务' })
  async getChunkProgress(@Param('fileHash') fileHash: string) {
    const data = await this.chunkService.getProgress(fileHash);
    return { code: 200, msg: '查询成功', data };
  }

  @Post('chunk/merge')
  @ApiOperation({ summary: '合并所有分片，生成最终文件' })
  @ApiResponse({ status: 200, description: '合并成功，返回最终文件路径' })
  @ApiResponse({ status: 400, description: '分片未全部上传' })
  @ApiResponse({ status: 404, description: '上传任务不存在' })
  async mergeChunks(@Body() dto: MergeChunkDto) {
    const data = await this.chunkService.mergeChunks(dto);
    return { code: 200, msg: '合并成功', data };
  }

  @Post('chunk/cleanup')
  @Role('admin', 'root')
  @ApiOperation({ summary: '手动触发过期分片清理（管理端）' })
  @ApiResponse({ status: 200, description: '清理完成，返回清理数量和耗时' })
  @ApiResponse({ status: 403, description: '无权访问' })
  async manualCleanup() {
    const data = await this.cleanupTask.cleanExpiredChunks();
    return { code: 200, msg: '清理完成', data };
  }

  // ===== 目录管理 =====

  @Post('storage/school')
  @Role('admin', 'root')
  @ApiOperation({ summary: '创建学校目录结构' })
  @ApiResponse({ status: 200, description: '目录创建成功' })
  @ApiResponse({ status: 403, description: '无权访问' })
  createSchoolDir(@Body() dto: CreateSchoolDirDto) {
    const basePath = this.storageService.createSchoolDir(dto);
    return { code: 200, msg: '目录创建成功', data: { basePath } };
  }

  @Post('storage/course')
  @Role('admin', 'root', 'school_root', 'school_admin')
  @ApiOperation({ summary: '创建课程目录结构' })
  @ApiResponse({ status: 200, description: '目录创建成功' })
  @ApiResponse({ status: 403, description: '无权访问' })
  createCourseDir(@Body() dto: CreateCourseDirDto) {
    const basePath = this.storageService.createCourseDir(dto);
    return { code: 200, msg: '目录创建成功', data: { basePath } };
  }

  @Post('storage/chapter-lesson')
  @ApiOperation({ summary: '创建章节/课时目录' })
  @ApiResponse({ status: 200, description: '目录创建成功' })
  createChapterLessonDir(@Body() dto: CreateChapterLessonDirDto) {
    const basePath = this.storageService.createChapterLessonDir(dto);
    return { code: 200, msg: '目录创建成功', data: { basePath } };
  }

  @Post('storage/homework')
  @ApiOperation({ summary: '创建作业提交目录' })
  @ApiResponse({ status: 200, description: '目录创建成功' })
  createHomeworkDir(@Body() dto: CreateHomeworkDirDto) {
    const basePath = this.storageService.createHomeworkDir(dto);
    return { code: 200, msg: '目录创建成功', data: { basePath } };
  }
}
