import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
} from 'class-validator';

export class InvitationDataDto {
  @ApiProperty({
    description: '邀请码类型 (0:老师加入学校, 1:学生加入学校, 2:学生加入课程)',
  })
  @IsNumber()
  @IsNotEmpty()
  type: number;

  @ApiProperty({ description: '学校ID' })
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiProperty({ description: '创建者ID' })
  @IsString()
  @IsNotEmpty()
  creater_id: string;

  @ApiProperty({ description: '创建时间戳 (s)' })
  @IsString()
  @IsNotEmpty()
  create_time: string;

  @ApiPropertyOptional({ description: '时限 (s)' })
  @IsNumber()
  @IsOptional()
  ttl?: number;
}

export class CreateInviteDto {
  @ApiProperty({
    description: '邀请码类型 (0:老师加入学校, 1:学生加入学校, 2:学生加入课程)',
  })
  @IsNumber()
  @IsNotEmpty()
  type: number;

  @ApiProperty({ description: '学校ID' })
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({ description: '过期时间 (秒)' })
  @IsNumber()
  @IsOptional()
  ttl: number;
}

/**
 * 邀请码查询 DTO
 */
export class InvitationQueryDto {
  @ApiPropertyOptional({ description: '邀请码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @IsString()
  creater_id?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  @IsOptional()
  @IsString()
  school_id?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsOptional()
  @IsString()
  class_id?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsInt()
  type?: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  pageSize?: number = 10;
}
