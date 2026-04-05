/**
 * 文件类型映射
 * 1: 视频
 * 2: 普通文件（如 pdf、word 等）
 */
export enum FileType {
  VIDEO = 1,
  NORMAL = 2,
}

export const FileTypeMap = {
  [FileType.VIDEO]: '视频',
  [FileType.NORMAL]: '普通文件',
};
