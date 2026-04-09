import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import {
  InvitationTypeMap,
  InvitationTypeValues,
} from '@/common/utils/invite-type.map';

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

  @ApiPropertyOptional({ description: '学院ID' })
  @IsString()
  @IsOptional()
  college_id?: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({ description: '课程ID' })
  @IsString()
  @IsOptional()
  course_id?: string;

  @ApiPropertyOptional({ description: '教学组ID' })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;

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
  @IsIn(InvitationTypeValues)
  @IsNotEmpty()
  type: number;

  @ApiProperty({ description: '学校ID' })
  @IsString()
  @IsNotEmpty()
  school_id: string;

  @ApiPropertyOptional({ description: '学院ID' })
  @IsString()
  @IsOptional()
  college_id?: string;

  @ApiPropertyOptional({ description: '入学年份' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ description: '班级ID' })
  @IsString()
  @IsOptional()
  class_id?: string;

  @ApiPropertyOptional({ description: '课程ID' })
  @IsString()
  @IsOptional()
  course_id?: string;

  @ApiPropertyOptional({ description: '教学组ID' })
  @IsString()
  @IsOptional()
  teaching_group_id?: string;

  @ApiPropertyOptional({ description: '过期时间 (秒)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  ttl?: number;
}

export class CreateCourseInviteDto {
  @ApiPropertyOptional({
    description: '学校ID，平台管理员场景可指定，教师场景可不传',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  school_id?: string;

  @ApiProperty({ description: '课程ID' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({ description: '教学组ID' })
  @IsString()
  @IsNotEmpty()
  teaching_group_id: string;

  @ApiPropertyOptional({ description: '邀请码有效时长(秒)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  ttl?: number;
}

export class CreateCourseInviteResponseDto {
  @ApiProperty({ description: '邀请码' })
  code: string;

  @ApiProperty({
    description: '邀请码类型',
    example: InvitationTypeMap.STUDENT_JOIN_COURSE,
  })
  type: number;

  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '教学组ID' })
  teaching_group_id: string;

  @ApiProperty({ description: '创建时间戳(s)' })
  createTime: string;

  @ApiPropertyOptional({ description: '邀请码有效时长(s)' })
  ttl?: number | null;

  @ApiPropertyOptional({ description: '失效时间戳(s)' })
  expire_time?: string | null;
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

  @ApiPropertyOptional({ description: '学院ID' })
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional({ description: '学院名称' })
  @IsOptional()
  @IsString()
  collegeName?: string;

  @ApiPropertyOptional({ description: '课程ID' })
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional({ description: '教学组ID' })
  @IsOptional()
  @IsString()
  teaching_group_id?: string;

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '状态 (1:有效, 0:无效)' })
  @IsOptional()
  @IsInt()
  status?: number;

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
