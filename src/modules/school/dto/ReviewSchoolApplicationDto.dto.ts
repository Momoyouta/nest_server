import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { SchoolApplicationReviewActionValues } from '@/common/utils/school-application.map';

export class ReviewSchoolApplicationDto {
  @ApiProperty({ description: '审批动作: approve/reject' })
  @IsIn(SchoolApplicationReviewActionValues)
  action: string;

  @ApiProperty({ description: '审批备注', required: false })
  @IsOptional()
  @IsString()
  review_remark?: string;

  @ApiProperty({ description: '拒绝原因编', required: false })
  @IsOptional()
  @IsString()
  reject_reason?: string;
}
