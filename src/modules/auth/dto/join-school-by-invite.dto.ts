import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinSchoolByInviteCodeDto {
  @ApiProperty({ description: '邀请码' })
  @IsString()
  @IsNotEmpty({ message: '邀请码不能为空' })
  code: string;
}

export class JoinSchoolByInviteCodeResponseDto {
  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @ApiProperty({ description: '身份类型 (1: Teacher, 2: Student)' })
  actor_type: number;

  @ApiProperty({ description: '具体身份记录ID' })
  actor_id: string;

  @ApiProperty({ description: '是否成功加入', example: true })
  joined: boolean;
}
