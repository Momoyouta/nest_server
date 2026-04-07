import { ApiProperty } from '@nestjs/swagger';
import {
  CourseAssignmentStatusMap,
  CourseAssignmentStatusValues,
} from '@/common/utils/course.map';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_assignment')
export class CourseAssignment {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '作业ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教师ID' })
  teacher_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '作业标题' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '作业描述', required: false })
  description?: string;

  @Column({
    type: 'tinyint',
    nullable: true,
    default: CourseAssignmentStatusMap.DRAFT,
  })
  @ApiProperty({
    description: '作业状态: 0-草稿, 1-已发布',
    required: false,
    enum: CourseAssignmentStatusValues,
    default: CourseAssignmentStatusMap.DRAFT,
  })
  status?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '截止时间戳(s)', required: false })
  deadline?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '开始时间戳(s)', required: false })
  start_time?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '教学组ID', required: false })
  teaching_group_id?: string;

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
