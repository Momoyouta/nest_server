import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@/database/entities/role.entity';

export class CurrentUserInfoDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '姓名' })
  name: string;

  @ApiProperty({ description: '角色ID，逗号分隔' })
  role_id: string;

  @ApiProperty({ description: '性别' })
  sex: boolean;

  @ApiProperty({ description: '账号' })
  account: string;

  @ApiPropertyOptional({ description: '手机号' })
  phone?: string;

  @ApiProperty({ description: '头像url' })
  avatar: string;

  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @ApiPropertyOptional({ description: '更新时间戳(s)' })
  update_time?: string;

  @ApiPropertyOptional({ description: '状态' })
  status?: number;
}

export class CurrentTeacherInfoDto {
  @ApiProperty({ description: '教师ID' })
  teacher_id: string;

  @ApiPropertyOptional({ description: '工号' })
  teacher_number?: string;

  @ApiPropertyOptional({ description: '学院' })
  college?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  school_id?: string;

  @ApiPropertyOptional({ description: '学校名称' })
  school_name?: string;
}

export class CurrentStudentInfoDto {
  @ApiProperty({ description: '学生ID' })
  student_id: string;

  @ApiPropertyOptional({ description: '学号' })
  student_number?: string;

  @ApiPropertyOptional({ description: '学院' })
  college?: string;

  @ApiPropertyOptional({ description: '学校ID' })
  school_id?: string;

  @ApiPropertyOptional({ description: '学校名称' })
  school_name?: string;
}

export class CurrentUserProfile {
  @ApiProperty({ description: '用户信息', type: () => CurrentUserInfoDto })
  user: CurrentUserInfoDto;

  @ApiProperty({ description: '角色列表', type: [Role] })
  roles: Role[];

  @ApiPropertyOptional({
    description: '教师信息',
    type: () => CurrentTeacherInfoDto,
  })
  teacherInfo?: CurrentTeacherInfoDto | null;

  @ApiPropertyOptional({
    description: '学生信息',
    type: () => CurrentStudentInfoDto,
  })
  studentInfo?: CurrentStudentInfoDto | null;

  @ApiProperty({ description: '学校名称' })
  school_name: string;
}
