import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FilePathTemplate, resolvePath } from '@/common/utils/file-path.map';
import { CreateSchoolDirDto } from './dto/create-school-dir.dto';
import { CreateCourseDirDto } from './dto/create-course-dir.dto';
import { CreateChapterLessonDirDto } from './dto/create-chapter-lesson-dir.dto';
import { CreateHomeworkDirDto } from './dto/create-homework-dir.dto';

@Injectable()
export class StorageService {
  /**
   * 创建学校目录结构
   * 包含：avatars、materials、publicMaterials、courses
   */
  createSchoolDir(dto: CreateSchoolDirDto): string {
    const { schoolId } = dto;
    const dirs = [
      FilePathTemplate.schoolAvatars(schoolId),
      FilePathTemplate.schoolResourceVideos(schoolId),
      FilePathTemplate.schoolResourceDocs(schoolId),
      FilePathTemplate.schoolResourceImages(schoolId),
      FilePathTemplate.schoolPrivate(schoolId),
      FilePathTemplate.schoolRoot(schoolId) + '/courses',
    ];
    dirs.forEach((dir) => {
      fs.mkdirSync(dir, { recursive: true });
    });
    return `schools/${schoolId}`;
  }

  /**
   * 移动文件
   * @param srcRelative 源相对路径 (如: uploads/temp/images/xxx.png)
   * @param destRelative 目标相对路径 (如: schools/1/private/evidence_img.png)
   */
  moveFile(srcRelative: string, destRelative: string): void {
    // 处理路径开头，确保没有多余的斜杠，且能被 resolvePath 正确识别
    const cleanSrc = srcRelative.replace(/^\/+/, '').split('/');
    const cleanDest = destRelative.replace(/^\/+/, '').split('/');

    const srcAbs = resolvePath(...cleanSrc);
    const destAbs = resolvePath(...cleanDest);

    if (fs.existsSync(srcAbs)) {
      // 确保目标目录存在
      const destDir = fs.realpathSync(destAbs.substring(0, destAbs.lastIndexOf(path.sep)));
      // 实际上 mkdirSync({recursive: true}) 在 createSchoolDir 时已经做了
      fs.renameSync(srcAbs, destAbs);
    }
  }

  /**
   * 创建课程目录结构
   * 包含：materials、chapters、homework
   */
  createCourseDir(dto: CreateCourseDirDto): string {
    const { schoolId, courseId } = dto;
    const dirs = [
      FilePathTemplate.courseMaterials(schoolId, courseId),
      FilePathTemplate.courseChapters(schoolId, courseId),
      FilePathTemplate.homeworkRoot(schoolId, courseId),
    ];
    dirs.forEach((dir) => {
      fs.mkdirSync(dir, { recursive: true });
    });
    return `schools/${schoolId}/courses/${courseId}`;
  }

  /**
   * 创建章节/课时目录结构
   */
  createChapterLessonDir(dto: CreateChapterLessonDirDto): string {
    const { schoolId, courseId, chapterId, lessonId } = dto;
    const dir = FilePathTemplate.chapterLesson(
      schoolId,
      courseId,
      chapterId,
      lessonId,
    );
    fs.mkdirSync(dir, { recursive: true });
    return `schools/${schoolId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`;
  }

  /**
   * 创建作业提交目录
   */
  createHomeworkDir(dto: CreateHomeworkDirDto): string {
    const { schoolId, courseId, homeworkId, submitId } = dto;
    const dir = FilePathTemplate.homeworkSubmit(
      schoolId,
      courseId,
      homeworkId,
      submitId,
    );
    fs.mkdirSync(dir, { recursive: true });
    return `schools/${schoolId}/courses/${courseId}/homework/${homeworkId}/${submitId}`;
  }
}
