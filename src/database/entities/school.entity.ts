import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('school')
export class School {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '学校ID' })
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '创建时间戳 (s)', required: false })
  create_time: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '更新时间戳 (s)', required: false })
  update_time: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学校名称', required: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学校地址', required: false })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '负责人姓名', required: false })
  charge_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '负责人电话', required: false })
  charge_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '凭证图片URL', required: false })
  evidence_img_url: string;

  /**
   * 状态 (0: 审核中, 1: 启用, 2: 禁用)
   */
  @Column({ type: 'smallint', nullable: true, default: 0 })
  @ApiProperty({ description: '状态 (0: 审核中, 1: 启用, 2: 禁用)', required: false })
  status: number;

  @BeforeInsert()
  updateCreateTime() {
    const now = String(Math.floor(Date.now() / 1000));
    this.create_time = now;
    this.update_time = now;
  }

  @BeforeUpdate()
  updateUpdateTime() {
    this.update_time = String(Math.floor(Date.now() / 1000));
  }
}
