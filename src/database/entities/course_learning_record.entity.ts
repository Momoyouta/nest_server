import { ApiProperty } from '@nestjs/swagger';
import { BinaryFlagMap, BinaryFlagValues } from '@/common/utils/course.map';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_learning_record')
export class CourseLearningRecord {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学习记录ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学生ID' })
  student_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '章节ID' })
  chapter_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课时ID' })
  lesson_id: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiProperty({ description: '学习进度(0-100)', required: false, default: 0 })
  progress_percent?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiProperty({ description: '学习次数', required: false, default: 0 })
  learn_count?: number;

  @Column({ type: 'tinyint', nullable: true, default: BinaryFlagMap.NO })
  @ApiProperty({
    description: '是否已学完: 0-否, 1-是',
    required: false,
    enum: BinaryFlagValues,
    default: BinaryFlagMap.NO,
  })
  is_completed?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '最后学习时间戳(s)', required: false })
  last_learn_time?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '创建时间戳(s)', required: false })
  create_time?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '更新时间戳(s)', required: false })
  update_time?: string;

  @BeforeInsert()
  setCreateFields() {
    if (!this.id) {
      this.id = v4();
    }
    const now = String(Math.floor(Date.now() / 1000));
    this.create_time = now;
    this.update_time = now;
  }

  @BeforeUpdate()
  setUpdateTime() {
    this.update_time = String(Math.floor(Date.now() / 1000));
  }
}
