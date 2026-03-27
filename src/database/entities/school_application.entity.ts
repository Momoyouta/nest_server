import { Entity, Column, PrimaryColumn, BeforeInsert } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';

@Entity('school_applications')
export class SchoolApplication {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '申请ID' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @ApiProperty({ description: '学校名称' })
  school_name: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学校地址' })
  school_address: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: '负责人姓名' })
  charge_name: string;

  @Column({ type: 'varchar', length: 20 })
  @ApiProperty({ description: '负责人手机号' })
  charge_phone: string;

  @Column({ type: 'varchar', length: 512 })
  @ApiProperty({ description: '证明材料图片URL' })
  evidence_img_url: string;

  @Column({ type: 'tinyint', default: 0 })
  @ApiProperty({ description: '审核状态: 0-待审核, 1-通过, 2-驳回' })
  status: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '审核备注', required: false })
  review_remark?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '处理该申请的管理员ID', required: false })
  reviewed_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '拒绝原因', required: false })
  reject_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: '申请提交时间', required: false })
  created_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: '最后更新时间', required: false })
  updated_at?: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = v4();
    }
  }
}
