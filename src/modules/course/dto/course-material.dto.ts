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
  file_id: string;

  @ApiProperty({ description: '文件名' })
  file_name: string;

  @ApiProperty({ description: '上传者ID' })
  uploader_id: string;

  @ApiProperty({ description: '上传者姓名' })
  uploader_name: string;

  @ApiProperty({ description: '绑定时间戳(s)' })
  create_time: string;
}

export class ListMaterialResponseDto {
  @ApiProperty({ type: [MaterialItemDto] })
  list: MaterialItemDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}
