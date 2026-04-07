import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class UserSchoolIdentity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '用户ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学校ID' })
  school_id: string;

  /**
   * 角色类型: 1-teacher, 2-student
   */
  @Column({ type: 'tinyint', comment: '1-teacher, 2-student' })
  @ApiProperty({ description: '角色类型 (1: teacher, 2: student)' })
  actor_type: number;

  @Column({ type: 'varchar', length: 255, comment: 'teacher.id 或 student.id' })
  @ApiProperty({ description: '具体角色的ID (teacher.id 或 student.id)' })
  actor_id: string;

  /**
   * 状态: 1-启用, 2-禁用/删除
   */
  @Column({ type: 'tinyint', default: 1 })
  @ApiProperty({ description: '状态 (1: 启用, 2: 禁用/删除)', required: false })
  status: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '创建时间戳 (s)', required: false })
  create_time: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '更新时间戳 (s)', required: false })
  update_time: string;

  @BeforeInsert()
  generateIdAndCreateTime() {
    if (!this.id) {
      this.id = v4();
    }
    const now = String(Math.floor(Date.now() / 1000));
    this.create_time = now;
    this.update_time = now;
  }

  @BeforeUpdate()
  updateUpdateTime() {
    this.update_time = String(Math.floor(Date.now() / 1000));
  }
}
