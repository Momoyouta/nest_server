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
import { FileChunk } from '@/modules/file/chunk/chunk.entity';
import { User } from '@/database/entities/user.entity';
import { School } from '@/database/entities/school.entity';
import { SchoolAdmin } from '@/database/entities/school_admin.entity';
import {
  DeleteFileChunkDto,
  DeleteFileChunkResponseDto,
  FileChunkAdminListItemDto,
  FileChunkAdminListResponseDto,
  MoveFileChunkResponseDto,
  MoveFileChunkToSchoolDto,
  QueryFileChunkAdminDto,
  UpdateFileChunkFilenameDto,
  UpdateFileChunkFilenameResponseDto,
} from '@/modules/file_admin/dto/file_chunk_admin.dto';
import {
  FileChunkAdminSortByMap,
  FileChunkAdminSortColumnMap,
  FileChunkAdminSortOrderMap,
  FileChunkStatusMap,
  FileChunkTypeMap,
} from '@/common/utils/file-chunk-admin.map';
import { AsyncLocalstorageService } from '@/modules/async/async/asyncLocalstorage.service';
import { PlatformAdminRoles, SchoolAdminRoles } from '@/common/utils/role.map';
import { resolvePath } from '@/common/utils/file-path.map';

interface AdminScopeInfo {
  user: User;
  isPlatformAdmin: boolean;
  isSchoolAdmin: boolean;
  schoolId?: string;
}

interface FileChunkListRawRow {
  id: string;
  fileHash: string;
  fileName: string;
  fileSize: number | string;
  status: FileChunkStatusMap;
  targetPath: string | null;
  type: number | string | null;
  creatorId: string | null;
  schoolId: string | null;
  createTime: string | Date | null;
  updateTime: string | Date | null;
  creatorName: string | null;
  schoolName: string | null;
}

@Injectable()
export class FileChunkAdminService {
  constructor(
    @InjectRepository(FileChunk)
    private readonly fileChunkRepository: Repository<FileChunk>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    private readonly alsService: AsyncLocalstorageService,
  ) {}

  async query(
    dto: QueryFileChunkAdminDto,
  ): Promise<FileChunkAdminListResponseDto> {
    const scope = await this.resolveAdminScope();
    const {
      page = 1,
      pageSize = 10,
      id,
      fileHash,
      filename,
      status,
      type,
      creatorId,
      schoolId,
      sortBy = FileChunkAdminSortByMap.updateTime,
      sortOrder = FileChunkAdminSortOrderMap.DESC,
    } = dto;

    const pageNumber = this.normalizePositiveInt(page, 1);
    const pageSizeNumber = this.normalizePositiveInt(pageSize, 10);
    const typeFilter =
      typeof type === 'undefined' || type === null ? undefined : Number(type);

    const qb = this.fileChunkRepository
      .createQueryBuilder('fc')
      .leftJoin(User, 'u', 'u.id = fc.creator_id')
      .leftJoin(School, 's', 's.id = fc.school_id')
      .where('1 = 1');

    if (id) {
      qb.andWhere('fc.id = :id', { id });
    }
    if (fileHash) {
      qb.andWhere('fc.file_hash = :fileHash', { fileHash });
    }
    if (filename) {
      qb.andWhere('fc.file_name LIKE :filename', { filename: `%${filename}%` });
    }
    if (status) {
      qb.andWhere('fc.status = :status', { status });
    }
    if (typeof typeFilter !== 'undefined' && !Number.isNaN(typeFilter)) {
      qb.andWhere('fc.type = :type', { type: typeFilter });
    }
    if (creatorId) {
      qb.andWhere('fc.creator_id = :creatorId', { creatorId });
    }

    if (scope.isSchoolAdmin) {
      qb.andWhere('fc.school_id = :scopeSchoolId', {
        scopeSchoolId: scope.schoolId,
      });
    } else if (schoolId) {
      qb.andWhere('fc.school_id = :schoolId', { schoolId });
    }

    const sortColumn =
      FileChunkAdminSortColumnMap[sortBy as FileChunkAdminSortByMap] ||
      FileChunkAdminSortColumnMap[FileChunkAdminSortByMap.updateTime];

    const total = await qb.getCount();

    qb.orderBy(sortColumn, sortOrder as any)
      .skip((pageNumber - 1) * pageSizeNumber)
      .take(pageSizeNumber)
      .select([
        'fc.id AS id',
        'fc.file_hash AS fileHash',
        'fc.file_name AS fileName',
        'fc.file_size AS fileSize',
        'fc.status AS status',
        'fc.target_path AS targetPath',
        'fc.type AS type',
        'fc.creator_id AS creatorId',
        'fc.school_id AS schoolId',
        'fc.create_time AS createTime',
        'fc.update_time AS updateTime',
        'u.name AS creatorName',
        's.name AS schoolName',
      ]);

    const rows = await qb.getRawMany<FileChunkListRawRow>();

    const items: FileChunkAdminListItemDto[] = rows.map((row) => ({
      id: String(row.id),
      fileHash: String(row.fileHash),
      fileName: String(row.fileName),
      fileSize: Number(row.fileSize ?? 0),
      status: row.status,
      targetPath: row.targetPath ?? null,
      type:
        row.type === null || typeof row.type === 'undefined'
          ? null
          : Number(row.type),
      creatorId: row.creatorId ?? null,
      schoolId: row.schoolId ?? null,
      createTime: row.createTime ? String(row.createTime) : undefined,
      updateTime: row.updateTime ? String(row.updateTime) : undefined,
      creatorName: row.creatorName ?? null,
      schoolName: row.schoolName ?? null,
    }));

    return {
      items,
      total,
    };
  }

  async updateFilename(
    dto: UpdateFileChunkFilenameDto,
  ): Promise<UpdateFileChunkFilenameResponseDto> {
    const scope = await this.resolveAdminScope();
    const record = await this.fileChunkRepository.findOne({
      where: { id: dto.id },
    });
    if (!record) {
      throw new NotFoundException('文件记录不存在');
    }

    this.assertWriteScope(record, scope);

    const nextFileName = dto.fileName.trim();
    if (!nextFileName) {
      throw new BadRequestException('fileName 不能为空');
    }

    record.fileName = nextFileName;
    record.updateTime = new Date();
    await this.fileChunkRepository.save(record);

    return {
      id: record.id,
      fileName: record.fileName,
      updateTime: record.updateTime,
    };
  }

  async remove(dto: DeleteFileChunkDto): Promise<DeleteFileChunkResponseDto> {
    const scope = await this.resolveAdminScope();
    const record = await this.fileChunkRepository.findOne({
      where: { id: dto.id },
    });
    if (!record) {
      throw new NotFoundException('文件记录不存在');
    }

    this.assertWriteScope(record, scope);

    const force = this.normalizeBoolean(dto.force as unknown);

    if (!force) {
      const sourceRelativePath = this.buildRelativeFilePath(record);
      this.deletePhysicalFileStrict(sourceRelativePath);
    } else {
      this.deletePhysicalFileIfPossible(record);
    }

    await this.fileChunkRepository.delete({ id: record.id });

    return {
      id: record.id,
      force,
      removed: true,
    };
  }

  async moveToSchool(
    dto: MoveFileChunkToSchoolDto,
  ): Promise<MoveFileChunkResponseDto> {
    const scope = await this.resolveAdminScope();
    const record = await this.fileChunkRepository.findOne({
      where: { id: dto.fileId },
    });
    if (!record) {
      throw new NotFoundException('文件记录不存在');
    }

    this.assertWriteScope(record, scope);

    if (scope.isSchoolAdmin && dto.schoolId !== scope.schoolId) {
      throw new ForbiddenException('无权迁移到其他学校资源库');
    }

    if (record.status !== FileChunkStatusMap.done.toString()) {
      throw new BadRequestException('仅允许 status=done 的文件执行迁移');
    }

    const targetSchool = await this.schoolRepository.findOneBy({
      id: dto.schoolId,
    });
    if (!targetSchool) {
      throw new BadRequestException('schoolId 不存在');
    }

    const sourceRelativePath = this.buildRelativeFilePath(record);
    const sourceAbsPath = this.toAbsolutePath(sourceRelativePath);
    if (!fs.existsSync(sourceAbsPath)) {
      throw new NotFoundException('源文件不存在，无法迁移');
    }

    const ext = this.getExtension(record.fileName);
    const [dir1, dir2] = this.resolveHashDirs(record.fileHash);
    const targetDir = this.resolveTargetDirectory(
      dto.schoolId,
      record.type,
      dir1,
      dir2,
    );
    const targetFilePath = `${targetDir}/${record.fileHash}${ext}`;
    const targetAbsPath = this.toAbsolutePath(targetFilePath);

    fs.mkdirSync(path.dirname(targetAbsPath), { recursive: true });

    try {
      fs.renameSync(sourceAbsPath, targetAbsPath);
    } catch {
      throw new BadRequestException('移动文件失败');
    }

    record.targetPath = targetDir;
    record.schoolId = dto.schoolId;
    record.updateTime = new Date();
    await this.fileChunkRepository.save(record);

    return {
      id: record.id,
      schoolId: record.schoolId,
      targetPath: record.targetPath,
      filePath: targetFilePath,
      updateTime: record.updateTime,
    };
  }

  private async resolveAdminScope(): Promise<AdminScopeInfo> {
    const userId = this.alsService.getUserId();
    if (!userId) {
      throw new ForbiddenException('未登录');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const roleIds = this.parseRoleIds(user);
    const isPlatformAdmin = roleIds.some((roleId) =>
      PlatformAdminRoles.includes(roleId),
    );
    const isSchoolAdmin = roleIds.some((roleId) =>
      SchoolAdminRoles.includes(roleId),
    );

    if (!isPlatformAdmin && !isSchoolAdmin) {
      throw new ForbiddenException('无管理权限');
    }

    if (!isSchoolAdmin) {
      return {
        user,
        isPlatformAdmin,
        isSchoolAdmin,
      };
    }

    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { user_id: user.id },
    });

    if (!schoolAdmin?.school_id) {
      throw new BadRequestException('学校管理员未绑定学校');
    }

    return {
      user,
      isPlatformAdmin,
      isSchoolAdmin,
      schoolId: schoolAdmin.school_id,
    };
  }

  private parseRoleIds(user: User): string[] {
    return (user.role_id || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private assertWriteScope(record: FileChunk, scope: AdminScopeInfo): void {
    if (!scope.isSchoolAdmin) {
      return;
    }

    if (!record.schoolId || record.schoolId !== scope.schoolId) {
      throw new ForbiddenException('无权操作其他学校文件');
    }
  }

  private buildRelativeFilePath(record: FileChunk): string {
    if (!record.targetPath) {
      throw new BadRequestException('记录缺少 target_path，无法定位物理文件');
    }

    const targetDir = this.normalizeRelativePath(record.targetPath);
    const ext = this.getExtension(record.fileName);
    return `${targetDir}/${record.fileHash}${ext}`;
  }

  private deletePhysicalFileStrict(relativePath: string): void {
    const absPath = this.toAbsolutePath(relativePath);

    if (!fs.existsSync(absPath)) {
      throw new NotFoundException(
        '目标文件不存在，请使用 force=true 强制清理记录',
      );
    }

    try {
      fs.unlinkSync(absPath);
    } catch {
      throw new BadRequestException('删除物理文件失败');
    }
  }

  private deletePhysicalFileIfPossible(record: FileChunk): void {
    try {
      const relativePath = this.buildRelativeFilePath(record);
      const absPath = this.toAbsolutePath(relativePath);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    } catch {
      // force=true 模式下忽略物理文件异常，继续删除数据库记录
    }
  }

  private resolveTargetDirectory(
    schoolId: string,
    type: number | null,
    dir1: string,
    dir2: string,
  ): string {
    if (type === FileChunkTypeMap.VIDEO) {
      return `schools/${schoolId}/resource_library/videos/${dir1}/${dir2}`;
    }
    if (type === FileChunkTypeMap.DOCUMENT) {
      return `schools/${schoolId}/resource_library/documents/${dir1}/${dir2}`;
    }
    throw new BadRequestException('仅支持 type=1 或 type=2 的文件迁移');
  }

  private resolveHashDirs(fileHash: string): [string, string] {
    const normalized = fileHash || '';
    const dir1 = normalized.slice(0, 2).padEnd(2, '0');
    const dir2 = normalized.slice(2, 4).padEnd(2, '0');
    return [dir1, dir2];
  }

  private getExtension(fileName: string): string {
    return path.extname(fileName || '');
  }

  private toAbsolutePath(relativePath: string): string {
    const normalized = this.normalizeRelativePath(relativePath);
    const segments = normalized
      .split('/')
      .filter((segment) => segment.length > 0);
    return resolvePath(...segments);
  }

  private normalizePositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();
      return lower === 'true' || lower === '1';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }

  private normalizeRelativePath(rawPath: string): string {
    const normalized = (rawPath || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+$/g, '')
      .replace(/\/+/g, '/');

    if (!normalized) {
      throw new BadRequestException('文件路径为空');
    }
    if (normalized.includes('..')) {
      throw new BadRequestException('文件路径非法');
    }

    return normalized;
  }
}
