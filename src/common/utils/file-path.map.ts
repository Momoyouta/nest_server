import * as path from 'path';

/**
 * 文件存储根目录（绝对路径）
 * 使用 getter 确保在 @nestjs/config 加载环境后再动态读取
 */
export const getFileStoreRoot = (): string => {
  const root = process.env.FILE_STORE_BASE_PATH;
  if (!root) {
    // 依然保留一个默认值，防止由于未配置导致的直接崩溃，仅在调用时报错或回退
    return 'E:\\毕设\\fileStore';
  }
  return root;
};

/** 路径模板工厂：根据根目录拼接相对路径 */
export const resolvePath = (...segments: string[]): string =>
  path.join(getFileStoreRoot(), ...segments);

/** 各业务目录路径模板 */
export const FilePathTemplate = {
  /** 学校根目录 */
  schoolRoot: (schoolId: number | string) =>
    resolvePath('schools', String(schoolId)),

  /** 学校头像目录 */
  schoolAvatars: (schoolId: number | string) =>
    resolvePath('schools', String(schoolId), 'avatars'),

  /** 学校通用教学资料 */
  schoolMaterials: (schoolId: number | string) =>
    resolvePath('schools', String(schoolId), 'materials'),

  /** 学校公共资源库 */
  schoolPublicMaterials: (schoolId: number | string) =>
    resolvePath('schools', String(schoolId), 'publicMaterials'),

  /** 课程根目录 */
  courseRoot: (schoolId: number | string, courseId: number | string) =>
    resolvePath('schools', String(schoolId), 'courses', String(courseId)),

  /** 课程专属资料 */
  courseMaterials: (schoolId: number | string, courseId: number | string) =>
    resolvePath(
      'schools',
      String(schoolId),
      'courses',
      String(courseId),
      'materials',
    ),

  /** 课程章节根目录 */
  courseChapters: (schoolId: number | string, courseId: number | string) =>
    resolvePath(
      'schools',
      String(schoolId),
      'courses',
      String(courseId),
      'chapters',
    ),

  /** 课时目录 */
  chapterLesson: (
    schoolId: number | string,
    courseId: number | string,
    chapterId: number | string,
    lessonId: number | string,
  ) =>
    resolvePath(
      'schools',
      String(schoolId),
      'courses',
      String(courseId),
      'chapters',
      String(chapterId),
      'lessons',
      String(lessonId),
    ),

  /** 作业根目录 */
  homeworkRoot: (schoolId: number | string, courseId: number | string) =>
    resolvePath(
      'schools',
      String(schoolId),
      'courses',
      String(courseId),
      'homework',
    ),

  /** 作业提交目录 */
  homeworkSubmit: (
    schoolId: number | string,
    courseId: number | string,
    homeworkId: number | string,
    submitId: number | string,
  ) =>
    resolvePath(
      'schools',
      String(schoolId),
      'courses',
      String(courseId),
      'homework',
      String(homeworkId),
      String(submitId),
    ),

  /** 全局用户头像目录 */
  userAvatars: () => resolvePath('users', 'avatars'),

  /** 临时图片目录 */
  tempImages: () => resolvePath('uploads', 'temp', 'images'),

  /** 分片上传临时目录 */
  chunkTemp: (fileHash: string) =>
    resolvePath('uploads', 'temp', 'chunks', fileHash),

  /** 分片文件路径 */
  chunkFile: (fileHash: string, chunkIndex: number) =>
    resolvePath('uploads', 'temp', 'chunks', fileHash, String(chunkIndex)),
};

export const FilePathMap = {
  TEMP_IMG: 'uploads/temp/images',

}
