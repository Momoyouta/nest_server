import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SelectSchoolDto {
  @ApiProperty({ description: '选择的学校ID' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;
}

export class SwitchSchoolDto {
  @ApiProperty({ description: '要切换到的学校ID' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;
}

export class UserSchoolInfoDto {
  @ApiProperty({ description: '用户ID' })
  userId: string;
  @ApiProperty({ description: '用户角色' })
  userRoles: string[];
  @ApiProperty({ description: '用户名' })
  userName: string;
  @ApiProperty({ description: '学校ID' })
  schoolId?: string;
}

export class PendingLoginResponseDto {
  @ApiProperty({ description: '过渡期Token，用于选校' })
  token: string;
  @ApiProperty({ description: '可选学校列表', type: [Object] })
  selectableSchools: any[];
  @ApiProperty({ description: '基础用户信息', type: UserSchoolInfoDto })
  baseUserInfo: UserSchoolInfoDto;
}

export class SelectSchoolResponseDto {
  @ApiProperty({ description: '完整的业务Token' })
  token: string;
  @ApiProperty({ description: '基础用户信息', type: UserSchoolInfoDto })
  baseUserInfo: UserSchoolInfoDto;
  @ApiProperty({ description: '当前学校下的用户资料' })
  userProfile: any;
}

export class SwitchSchoolResponseDto {
  @ApiProperty({ description: '新的业务Token' })
  token: string;
  @ApiProperty({ description: '切换到的学校ID' })
  schoolId: string;
}
