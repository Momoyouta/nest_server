import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplySchoolDto {
  @ApiProperty({ description: '学校名称' })
  @IsNotEmpty({ message: '学校名称不能为空' })
  @IsString()
  school_name: string;

  @ApiProperty({ description: '学校地址' })
  @IsNotEmpty({ message: '学校地址不能为空' })
  @IsString()
  school_address: string;

  @ApiProperty({ description: '负责人姓名' })
  @IsNotEmpty({ message: '负责人姓名不能为空' })
  @IsString()
  charge_name: string;

  @ApiProperty({ description: '负责人手机号' })
  @IsNotEmpty({ message: '负责人手机号不能为空' })
  @IsString()
  charge_phone: string;

  @ApiProperty({ description: '证明材料图片URL' })
  @IsNotEmpty({ message: '证明材料图片URL不能为空' })
  @IsString()
  evidence_img_url: string;
}
