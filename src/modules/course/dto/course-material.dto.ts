import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BindMaterialDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsString()
  course_id: string;

  @ApiProperty({ description: '资源库文件ID (file_chunk id)' })
  @IsNotEmpty()
  @IsString()
  file_id: string;
}

export class ListMaterialQueryDto {
  @ApiProperty({ description: '课程ID' })
  @IsNotEmpty()
  @IsString()
  course_id: string;

  @ApiProperty({ description: '文件名 (模糊搜索)', required: false })
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '页大小', default: 10, required: false })
  @IsOptional()
  pageSize?: number;
}

export class UpdateMaterialDto {
  @ApiProperty({ description: '资料记录ID (course_material id)' })
  @IsNotEmpty()
  @IsString()
  material_id: string;

  @ApiProperty({ description: '新文件名' })
  @IsNotEmpty()
  @IsString()
  file_name: string;
}

export class DeleteMaterialDto {
  @ApiProperty({ description: '资料记录ID (course_material id)' })
  @IsNotEmpty()
  @IsString()
  material_id: string;

  @ApiProperty({
    description: '删除模式：1-仅解绑, 2-彻底删除',
    enum: [1, 2],
  })
  @IsNotEmpty()
  mode: number;
}

export class MaterialItemDto {
  @ApiProperty({ description: '资料记录ID' })
  id: string;

  @ApiProperty({ description: '文件ID' })
  fileId: string;

  @ApiProperty({ description: '文件Hash' })
  fileHash: string;

  @ApiProperty({ description: '文件名' })
  fileName: string;

  @ApiProperty({ description: '文件大小' })
  fileSize: string;

  @ApiProperty({ description: '存储路径' })
  targetPath: string;

  @ApiProperty({ description: '文件类型' })
  type: number;

  @ApiProperty({ description: '创建者ID' })
  creatorId: string;

  @ApiProperty({ description: '学校ID' })
  schoolId: string;

  @ApiProperty({ description: '创建时间' })
  createTime: string;

  @ApiProperty({ description: '更新时间' })
  updateTime: string;

  @ApiProperty({ description: '创建者姓名' })
  creatorName: string;
}

export class ListMaterialResponseDto {
  @ApiProperty({ type: [MaterialItemDto] })
  list: MaterialItemDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}
