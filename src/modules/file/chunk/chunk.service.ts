import {
  BadRequestException,
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
import { FilePathTemplate, getFileStoreRoot } from '@/common/utils/file-path.map';

@Injectable()
export class ChunkService {
  constructor(
    @InjectRepository(FileChunk)
    private readonly chunkRepo: Repository<FileChunk>,
  ) {}

  /**
   * 初始化分片上传
   * 支持断点续传：同一 fileHash 存在 pending 记录时直接返回
   */
  async initUpload(dto: InitChunkDto) {
    const { fileHash, fileName, fileSize, totalChunks } = dto;

    // 查找已有的 pending/merging 记录（断点续传）
    const existing = await this.chunkRepo.findOne({
      where: { fileHash },
    });

    if (existing && (existing.status === 'pending' || existing.status === 'merging')) {
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
      createTime: now,
      updateTime: now,
    });
    await this.chunkRepo.save(chunk);

    // 创建分片缓冲目录
    const chunkDir = FilePathTemplate.chunkTemp(fileHash);
    fs.mkdirSync(chunkDir, { recursive: true });

    // 写入 metadata.json
    const metadata = { uploadId, fileHash, fileName, fileSize, totalChunks, createdAt: now.toISOString() };
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
  async uploadChunk(
    dto: UploadChunkDto,
    file: Express.Multer.File,
  ) {
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
    const { uploadId, fileHash, targetPath } = dto;

    const record = await this.chunkRepo.findOne({ where: { id: uploadId } });
    if (!record) {
      throw new NotFoundException('上传任务不存在');
    }

    // 幂等处理：已完成直接返回
    if (record.status === 'done') {
      const ext = record.fileName.split('.').pop();
      return { filePath: `${record.targetPath}/${fileHash}.${ext}` };
    }

    // 校验分片完整性
    if (record.uploadedChunks.length !== record.totalChunks) {
      throw new BadRequestException(
        `分片未全部上传，已上传 ${record.uploadedChunks.length}/${record.totalChunks}`,
      );
    }

    // 标记为 merging（防止并发重复合并）
    await this.chunkRepo.update(uploadId, { status: 'merging', updateTime: new Date() });

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

      return { filePath: `${targetPath}/${outputFileName}`.replace(/\\/g, '/') };
    } catch (error) {
      // 合并失败，回退状态
      await this.chunkRepo.update(uploadId, { status: 'pending', updateTime: new Date() });
      throw error;
    }
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
}
