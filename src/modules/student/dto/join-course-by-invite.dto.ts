import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinCourseByInviteCodeDto {
  @ApiProperty({ description: '邀请码' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class JoinCourseByInviteCodeResponseDto {
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @ApiProperty({ description: '教学组ID' })
  teaching_group_id: string;

  @ApiProperty({ description: '是否加入成功', example: true })
  joined: true;
}
