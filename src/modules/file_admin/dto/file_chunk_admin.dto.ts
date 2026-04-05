import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  FileChunkAdminSortByMap,
  FileChunkAdminSortOrderMap,
  FileChunkStatusMap,
  FileChunkTypeMap,
} from '@/common/utils/file-chunk-admin.map';

export class QueryFileChunkAdminDto {
  @ApiPropertyOptional({ description: '页码', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page 必须为整数' })
  @Min(1, { message: 'page 不能小于 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize 必须为整数' })
  @Min(1, { message: 'pageSize 不能小于 1' })
  @Max(100, { message: 'pageSize 不能大于 100' })
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '文件记录ID', example: 'uuid-v4' })
  @IsOptional()
  @IsString({ message: 'id 必须为字符串' })
  @MaxLength(255, { message: 'id 长度不能超过 255' })
  id?: string;

  @ApiPropertyOptional({
    description: '文件 hash',
    example: 'e4d909c290d0fb1ca068ffaddf22cbd0',
  })
  @IsOptional()
  @IsString({ message: 'fileHash 必须为字符串' })
  @MaxLength(255, { message: 'fileHash 长度不能超过 255' })
  fileHash?: string;

  @ApiPropertyOptional({
    description: '文件名关键字（模糊匹配）',
    example: '数学',
  })
  @IsOptional()
  @IsString({ message: 'filename 必须为字符串' })
  @MaxLength(255, { message: 'filename 长度不能超过 255' })
  filename?: string;

  @ApiPropertyOptional({
    description: '文件状态',
    enum: FileChunkStatusMap,
    example: FileChunkStatusMap.done,
  })
  @IsOptional()
  @IsEnum(FileChunkStatusMap, { message: 'status 非法' })
  status?: string;

  @ApiPropertyOptional({
    description: '文件类型（1: 视频, 2: 文档）',
    enum: FileChunkTypeMap,
    example: FileChunkTypeMap.VIDEO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(FileChunkTypeMap, { message: 'type 非法' })
  type?: number;

  @ApiPropertyOptional({ description: '创建者 userId', example: 'uuid-v4' })
  @IsOptional()
  @IsString({ message: 'creatorId 必须为字符串' })
  @MaxLength(255, { message: 'creatorId 长度不能超过 255' })
  creatorId?: string;

  @ApiPropertyOptional({ description: '学校ID', example: 'school-uuid' })
  @IsOptional()
  @IsString({ message: 'schoolId 必须为字符串' })
  @MaxLength(255, { message: 'schoolId 长度不能超过 255' })
  schoolId?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: FileChunkAdminSortByMap,
    default: FileChunkAdminSortByMap.updateTime,
  })
  @IsOptional()
  @IsEnum(FileChunkAdminSortByMap, { message: 'sortBy 非法' })
  sortBy?: string = FileChunkAdminSortByMap.updateTime;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: FileChunkAdminSortOrderMap,
    default: FileChunkAdminSortOrderMap.DESC,
  })
  @IsOptional()
  @IsEnum(FileChunkAdminSortOrderMap, { message: 'sortOrder 非法' })
  sortOrder?: string = FileChunkAdminSortOrderMap.DESC;
}

export class UpdateFileChunkFilenameDto {
  @ApiProperty({ description: '文件记录ID', example: 'uuid-v4' })
  @IsString({ message: 'id 必须为字符串' })
  @IsNotEmpty({ message: 'id 不能为空' })
  @MaxLength(255, { message: 'id 长度不能超过 255' })
  id!: string;

  @ApiProperty({ description: '新文件名', example: '高等数学第一章.mp4' })
  @IsString({ message: 'fileName 必须为字符串' })
  @IsNotEmpty({ message: 'fileName 不能为空' })
  @MaxLength(255, { message: 'fileName 长度不能超过 255' })
  fileName!: string;
}

export class DeleteFileChunkDto {
  @ApiProperty({ description: '文件记录ID', example: 'uuid-v4' })
  @IsString({ message: 'id 必须为字符串' })
  @IsNotEmpty({ message: 'id 不能为空' })
  @MaxLength(255, { message: 'id 长度不能超过 255' })
  id!: string;

  @ApiPropertyOptional({
    description: '是否强制清理记录（true 时忽略物理文件异常）',
    default: false,
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'force 必须为布尔值' })
  force?: boolean = false;
}

export class MoveFileChunkToSchoolDto {
  @ApiProperty({ description: '文件记录ID', example: 'uuid-v4' })
  @IsString({ message: 'fileId 必须为字符串' })
  @IsNotEmpty({ message: 'fileId 不能为空' })
  @MaxLength(255, { message: 'fileId 长度不能超过 255' })
  fileId!: string;

  @ApiProperty({ description: '目标学校ID', example: 'school-uuid' })
  @IsString({ message: 'schoolId 必须为字符串' })
  @IsNotEmpty({ message: 'schoolId 不能为空' })
  @MaxLength(255, { message: 'schoolId 长度不能超过 255' })
  schoolId!: string;
}

export class FileChunkAdminListItemDto {
  @ApiProperty({ description: '文件记录ID' })
  id!: string;

  @ApiProperty({ description: '文件 hash' })
  fileHash!: string;

  @ApiProperty({ description: '文件名' })
  fileName!: string;

  @ApiProperty({ description: '文件大小(byte)', example: 102400 })
  fileSize!: number;

  @ApiProperty({ enum: FileChunkStatusMap, description: '状态' })
  status!: string;

  @ApiPropertyOptional({ description: '目标目录相对路径' })
  targetPath?: string | null;

  @ApiPropertyOptional({ enum: FileChunkTypeMap, description: '文件类型' })
  type?: number | null;

  @ApiPropertyOptional({ description: '创建者ID' })
  creatorId?: string | null;

  @ApiPropertyOptional({ description: '学校ID' })
  schoolId?: string | null;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: string;

  @ApiPropertyOptional({ description: '更新时间' })
  updateTime?: string;

  @ApiPropertyOptional({ description: '创建者姓名' })
  creatorName?: string | null;

  @ApiPropertyOptional({ description: '学校名称' })
  schoolName?: string | null;
}

export class FileChunkAdminListResponseDto {
  @ApiProperty({ type: [FileChunkAdminListItemDto] })
  items!: FileChunkAdminListItemDto[];

  @ApiProperty({ description: '总数', example: 100 })
  total!: number;
}

export class UpdateFileChunkFilenameResponseDto {
  @ApiProperty({ description: '文件记录ID' })
  id!: string;

  @ApiProperty({ description: '新文件名' })
  fileName!: string;

  @ApiProperty({ description: '更新时间' })
  updateTime!: Date;
}

export class DeleteFileChunkResponseDto {
  @ApiProperty({ description: '文件记录ID' })
  id!: string;

  @ApiProperty({ description: '是否强制删除', example: false })
  force!: boolean;

  @ApiProperty({ description: '记录是否已删除', example: true })
  removed!: boolean;
}

export class MoveFileChunkResponseDto {
  @ApiProperty({ description: '文件记录ID' })
  id!: string;

  @ApiProperty({ description: '目标学校ID' })
  schoolId!: string;

  @ApiProperty({ description: '目标目录相对路径（不含文件名）' })
  targetPath!: string;

  @ApiProperty({ description: '目标文件完整相对路径（含文件名）' })
  filePath!: string;

  @ApiProperty({ description: '更新时间' })
  updateTime!: Date;
}
