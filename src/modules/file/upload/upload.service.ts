import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getFileStoreRoot } from '@/common/utils/file-path.map';
import { FileUploadScenario } from '@/common/utils/file-scenario.map';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadService {
  /**
   * 根据业务场景和参数，解析出对应的相对存储目录
   */
  resolveBusinessStoragePath(dto: {
    scenario: string;
    schoolId?: number;
    courseId?: number;
    homeworkId?: number;
  }): string {
    switch (dto.scenario) {
      case FileUploadScenario.AVATAR:
        return 'users/avatars';

      case FileUploadScenario.SCHOOL_RESOURCE:
        if (!dto.schoolId) {
          throw new BadRequestException('上传校本资源必须提供 schoolId');
        }
        return `schools/${dto.schoolId}/resource_library`;

      case FileUploadScenario.COURSE_HOMEWORK:
        if (!dto.schoolId || !dto.courseId) {
          throw new BadRequestException('上传课程作业必须提供 schoolId 和 courseId');
        }
        if (dto.homeworkId) {
          return `schools/${dto.schoolId}/courses/${dto.courseId}/homework/${dto.homeworkId}`;
        }
        return `schools/${dto.schoolId}/courses/${dto.courseId}/homework`;

      default:
        throw new BadRequestException('未知的上传场景');
    }
  }

  /**
   * 保存图片到磁盘
   * @param file multer 上传的文件对象
   * @param target 相对目标目录（如 schools/1/avatars）
   * @returns 相对存储路径（如 schools/1/avatars/abc123.png）
   */
  saveImage(file: Express.Multer.File, target: string): { path: string; size: number } {
    // 1. 校验文件大小
    if (file.size > MAX_SIZE) {
      throw new PayloadTooLargeException('文件大小超过限制 5MB');
    }

    // 2. 校验 MIME 类型
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型，仅支持 jpg/png/gif/webp');
    }

    // 3. 防止路径穿越攻击
    const sanitizedTarget = target.replace(/\.\./g, '').replace(/\\/g, '/');
    const absoluteDir = path.join(getFileStoreRoot(), sanitizedTarget);

    // 4. 确保目标目录存在
    fs.mkdirSync(absoluteDir, { recursive: true });

    // 5. 生成 hash 文件名
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'png';
    const hash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex')
      .substring(0, 16);
    const fileName = `${hash}.${ext}`;

    // 6. 写入磁盘
    const absolutePath = path.join(absoluteDir, fileName);
    fs.writeFileSync(absolutePath, file.buffer);

    return {
      path: `${sanitizedTarget}/${fileName}`.replace(/\\/g, '/'),
      size: file.size,
    };
  }
}
