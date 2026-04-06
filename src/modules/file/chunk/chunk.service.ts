import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileChunk } from './chunk.entity';
import { InitChunkDto } from './dto/init-chunk.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { MergeChunkDto } from './dto/merge-chunk.dto';
import {
  FilePathTemplate,
  getFileStoreRoot,
} from '@/common/utils/file-path.map';
import { PlatformAdminRoles } from '@/common/utils/role.map';
import { UploadService } from '../upload/upload.service';
import { Teacher } from '@/database/entities/teacher.entity';
import { Student } from '@/database/entities/student.entity';
import { User } from '@/database/entities/user.entity';
import { Course } from '@/database/entities/course.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { InitChunkUserDto } from './dto/init-chunk-user.dto';
import { UploadChunkUserDto } from './dto/upload-chunk-user.dto';
import { MergeChunkUserDto } from './dto/merge-chunk-user.dto';
import { QueryFileUserDto } from './dto/query-file-user.dto';
import { DownloadFileDto } from './dto/download-file.dto';

@Injectable()
export class ChunkService {
  constructor(
    @InjectRepository(FileChunk)
    private readonly chunkRepo: Repository<FileChunk>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly uploadService: UploadService,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

  /**
   * 初始化分片上传
   * 支持断点续传：同一 fileHash 存在 pending 记录时直接返回
   */
  async initUpload(dto: InitChunkDto) {
    const { fileHash, fileName, fileSize, totalChunks, type, schoolId } = dto;
    const userId = this.alsService.getUserId();

    // 查找已有的 pending/merging 记录（断点续传）
    const existing = await this.chunkRepo.findOne({
      where: { fileHash },
    });

    if (
      existing &&
      (existing.status === 'pending' || existing.status === 'merging')
    ) {
      return {
        uploadId: existing.id,
        fileHash: existing.fileHash,
        uploadedChunks: existing.uploadedChunks,
      };
    }

    // 若已 done，直接返回已有路径（防止重复上传）
    if (existing && existing.status === 'done') {
      return {
        uploadId: existing.id,
        fileHash: existing.fileHash,
        uploadedChunks: existing.uploadedChunks,
        filePath: existing.targetPath,
      };
    }

    // 创建新记录
    const uploadId = uuidv4();
    const now = new Date();
    const chunk = this.chunkRepo.create({
      id: uploadId,
      fileHash,
      fileName,
      fileSize,
      totalChunks,
      uploadedChunks: [],
      status: 'pending',
      type,
      creatorId: userId,
      schoolId,
      createTime: now,
      updateTime: now,
    });
    await this.chunkRepo.save(chunk);

    // 创建分片缓冲目录
    const chunkDir = FilePathTemplate.chunkTemp(fileHash);
    fs.mkdirSync(chunkDir, { recursive: true });

    // 写入 metadata.json
    const metadata = {
      uploadId,
      fileHash,
      fileName,
      fileSize,
      totalChunks,
      createdAt: now.toISOString(),
    };
    fs.writeFileSync(
      path.join(chunkDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8',
    );

    return { uploadId, fileHash, uploadedChunks: [] };
  }

  /**
   * 上传单个分片
   */
  async uploadChunk(dto: UploadChunkDto, file: Express.Multer.File) {
    const { uploadId, chunkIndex } = dto;

    const record = await this.chunkRepo.findOne({ where: { id: uploadId } });
    if (!record) {
      throw new NotFoundException('上传任务不存在');
    }

    // 写入分片文件
    const chunkPath = FilePathTemplate.chunkFile(record.fileHash, chunkIndex);
    fs.writeFileSync(chunkPath, file.buffer);

    // 更新已上传分片列表（幂等：去重）
    const uploadedSet = new Set(record.uploadedChunks);
    uploadedSet.add(chunkIndex);
    const uploadedChunks = Array.from(uploadedSet).sort((a, b) => a - b);

    await this.chunkRepo.update(uploadId, {
      uploadedChunks,
      updateTime: new Date(),
    });

    return { chunkIndex, uploadedChunks };
  }

  /**
   * 查询分片上传进度
   */
  async getProgress(fileHash: string) {
    const record = await this.chunkRepo.findOne({ where: { fileHash } });
    if (!record) {
      throw new NotFoundException('未找到上传任务');
    }
    return {
      uploadId: record.id,
      status: record.status,
      uploadedChunks: record.uploadedChunks,
      totalChunks: record.totalChunks,
    };
  }

  /**
   * 合并分片
   */
  async mergeChunks(dto: MergeChunkDto) {
    const { uploadId, fileHash } = dto;

    const record = await this.chunkRepo.findOne({ where: { id: uploadId } });
    if (!record) {
      throw new NotFoundException('上传任务不存在');
    }

    const targetPath = this.uploadService.resolveBusinessStoragePath({
      ...dto,
      type: record.type,
    });

    // 幂等处理：已完成直接返回
    if (record.status === 'done') {
      const ext = record.fileName.split('.').pop();
      return {
        fileId: record.id,
        filePath: `${record.targetPath}/${fileHash}.${ext}`.replace(/\\/g, '/'),
      };
    }

    // 校验分片完整性
    if (record.uploadedChunks.length !== record.totalChunks) {
      throw new BadRequestException(
        `分片未全部上传，已上传 ${record.uploadedChunks.length}/${record.totalChunks}`,
      );
    }

    // 标记为 merging（防止并发重复合并）
    await this.chunkRepo.update(uploadId, {
      status: 'merging',
      updateTime: new Date(),
    });

    try {
      // 确保目标目录存在
      const absoluteTargetDir = path.join(getFileStoreRoot(), targetPath);
      fs.mkdirSync(absoluteTargetDir, { recursive: true });

      // 按序合并分片
      const ext = record.fileName.split('.').pop() || 'mp4';
      const outputFileName = `${fileHash}.${ext}`;
      const outputPath = path.join(absoluteTargetDir, outputFileName);
      const writeStream = fs.createWriteStream(outputPath);

      for (let i = 0; i < record.totalChunks; i++) {
        const chunkPath = FilePathTemplate.chunkFile(fileHash, i);
        const chunkBuffer = fs.readFileSync(chunkPath);
        writeStream.write(chunkBuffer);
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // 删除临时分片目录
      const chunkDir = FilePathTemplate.chunkTemp(fileHash);
      fs.rmSync(chunkDir, { recursive: true, force: true });

      // 更新 DB 状态为 done
      await this.chunkRepo.update(uploadId, {
        status: 'done',
        targetPath,
        updateTime: new Date(),
      });

      return {
        fileId: record.id,
        filePath: `${targetPath}/${outputFileName}`.replace(/\\/g, '/'),
      };
    } catch (error) {
      // 合并失败，回退状态
      await this.chunkRepo.update(uploadId, {
        status: 'pending',
        updateTime: new Date(),
      });
      throw error;
    }
  }

  // ===== 用户端方法（校验 teacher_id 与 course.creator_id）=====

  /**
   * 校验当前登录用户是否为课程创建者
   * @param courseId 课程 ID（来自 DTO，undefined 则跳过课程校验）
   */
  private async validateCourseOwnership(courseId?: string): Promise<void> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { user_id: userId },
    });
    if (!teacher) {
      throw new ForbiddenException('仅教师可操作');
    }

    if (courseId !== undefined && courseId !== null) {
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
      });
      if (!course) {
        throw new NotFoundException('课程不存在');
      }
      if (course.creator_id !== teacher.id) {
        throw new ForbiddenException('仅课程创建者可上传课程资源');
      }
    }
  }

  /** 用户端：初始化分片上传（需校验为课程创建者） */
  async initUploadUser(
    dto: InitChunkUserDto,
  ): Promise<ReturnType<ChunkService['initUpload']>> {
    await this.validateCourseOwnership(dto.courseId);
    return this.initUpload(dto);
  }

  /** 用户端：上传单个分片（需校验为课程创建者） */
  async uploadChunkUser(
    dto: UploadChunkUserDto,
    file: Express.Multer.File,
  ): Promise<ReturnType<ChunkService['uploadChunk']>> {
    await this.validateCourseOwnership(dto.courseId);
    return this.uploadChunk(dto as any, file);
  }

  /** 用户端：查询分片进度（仅校验教师身份） */
  async getProgressUser(
    fileHash: string,
  ): Promise<ReturnType<ChunkService['getProgress']>> {
    await this.validateCourseOwnership();
    return this.getProgress(fileHash);
  }

  /** 用户端：合并分片（需校验为课程创建者） */
  async mergeChunksUser(
    dto: MergeChunkUserDto,
  ): Promise<ReturnType<ChunkService['mergeChunks']>> {
    await this.validateCourseOwnership(dto.courseId);
    return this.mergeChunks(dto as any);
  }

  /**
   * 清理过期分片（供定时任务调用）
   * @param expireHours 超时小时数
   * @returns 清理数量
   */
  async cleanExpiredChunks(expireHours: number): Promise<number> {
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() - expireHours);

    const expiredRecords = await this.chunkRepo
      .createQueryBuilder('fc')
      .where('fc.status = :status', { status: 'pending' })
      .andWhere('fc.create_time < :expireDate', { expireDate })
      .getMany();

    let count = 0;
    for (const record of expiredRecords) {
      // 删除磁盘目录（忽略文件系统错误）
      const chunkDir = FilePathTemplate.chunkTemp(record.fileHash);
      try {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      } catch {
        // 目录已不存在，忽略
      }

      // 更新状态为 expired
      await this.chunkRepo.update(record.id, {
        status: 'expired',
        updateTime: new Date(),
      });
      count++;
    }
    return count;
  }

  /** 用户端：分页查询文件（模糊搜索 + 学校校验） */
  async queryFilesUser(dto: QueryFileUserDto) {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const { page = 1, pageSize = 10, filename, schoolId } = dto;

    // 1. 获取用户所属学校
    const [teacher, student] = await Promise.all([
      this.teacherRepository.findOne({ where: { user_id: userId } }),
      this.studentRepository.findOne({ where: { user_id: userId } }),
    ]);

    const userSchoolId = teacher?.school_id || student?.school_id;

    // 2. 校验 schoolId 权限
    if (!userSchoolId) {
      // 如果没有绑定的学校，且不是管理员（管理员通常不通过这个接口查，或者走 admin 接口）
      // 这里为严谨，如果没学校信息，则禁止查询
      throw new ForbiddenException('当前用户未绑定学校，无权查询文件');
    }

    if (schoolId !== userSchoolId) {
      throw new ForbiddenException('无权查询其他学校的文件资源');
    }

    // 3. 构建查询条件 (仅查询状态为 done 的记录)
    const qb = this.chunkRepo.createQueryBuilder('fc')
      .leftJoin(User, 'u', 'u.id = fc.creator_id')
      .select([
        'fc.id as id',
        'fc.file_hash as fileHash',
        'fc.file_name as fileName',
        'fc.file_size as fileSize',
        'fc.target_path as targetPath',
        'fc.type as type',
        'fc.creator_id as creatorId',
        'fc.school_id as schoolId',
        'fc.create_time as createTime',
        'fc.update_time as updateTime',
      ])
      .addSelect('u.name', 'creatorName')
      .where('fc.school_id = :schoolId', { schoolId })
      .andWhere("fc.status = 'done'");

    if (filename) {
      qb.andWhere('fc.file_name LIKE :filename', {
        filename: `%${filename}%`,
      });
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy('fc.update_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany();

    return {
      items,
      total,
    };
  }

  /**
   * 下载文件：根据 schoolId 和 fileHash 获取文件物理路径及原始文件名
   * 包含基础权限校验：当前用户所属学校必须匹配
   */
  async downloadFile(dto: DownloadFileDto) {
    const store = this.alsService.getStore();
    const userId = store?.userId;

    // 适配单角色字符串或多角色数组的情况
    let roleIds: string[] = [];
    if (store?.roleIds) {
      roleIds = Array.isArray(store.roleIds) ? store.roleIds : [store.roleIds];
    }

    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const { schoolId, fileHash } = dto;

    // 1. 判断是否为平台管理员
    const isPlatformAdmin = roleIds.some((roleId) =>
      PlatformAdminRoles.includes(roleId),
    );

    // 2. 权限校验
    if (!isPlatformAdmin) {
      // 非平台管理员，必须校验 schoolId
      // 获取用户所属学校 (可能是教师、学生或学校管理员)
      const [teacher, student, schoolAdmin] = await Promise.all([
        this.teacherRepository.findOne({ where: { user_id: userId } }),
        this.studentRepository.findOne({ where: { user_id: userId } }),
        this.schoolAdminRepository.findOne({ where: { user_id: userId } }),
      ]);

      const userSchoolId =
        teacher?.school_id || student?.school_id || schoolAdmin?.school_id;

      if (!userSchoolId) {
        throw new ForbiddenException('当前用户未绑定学校，无权下载文件');
      }

      if (schoolId !== userSchoolId) {
        throw new ForbiddenException('无权下载其他学校的文件资源');
      }
    }

    // 3. 查询已完成的文件记录
    const record = await this.chunkRepo.findOne({
      where: {
        schoolId,
        fileHash,
        status: 'done',
      },
    });

    if (!record) {
      throw new NotFoundException('找不到指定的文件记录');
    }

    // 4. 拼接物理路径
    // 根据 mergeChunks 逻辑，文件名为 ${fileHash}.${ext}
    const ext = record.fileName.split('.').pop() || '';
    const outputFileName = ext ? `${fileHash}.${ext}` : fileHash;
    const absolutePath = path.join(
      getFileStoreRoot(),
      record.targetPath || '',
      outputFileName,
    );

    // 5. 校验物理文件是否存在
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('物理文件不存在或已被删除');
    }

    return {
      absolutePath,
      fileName: record.fileName, // 原始文件名
    };
  }
}
