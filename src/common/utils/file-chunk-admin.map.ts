export enum FileChunkStatusMap {
  pending = 'pending',
  merging = 'merging',
  done = 'done',
  expired = 'expired',
}

export enum FileChunkTypeMap {
  VIDEO = 1,
  DOCUMENT = 2,
}

export enum FileChunkAdminSortByMap {
  createTime = 'createTime',
  updateTime = 'updateTime',
  fileSize = 'fileSize',
}

export enum FileChunkAdminSortOrderMap {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const FileChunkAdminSortColumnMap: Record<
  FileChunkAdminSortByMap,
  string
> = {
  [FileChunkAdminSortByMap.createTime]: 'fc.create_time',
  [FileChunkAdminSortByMap.updateTime]: 'fc.update_time',
  [FileChunkAdminSortByMap.fileSize]: 'fc.file_size',
};
