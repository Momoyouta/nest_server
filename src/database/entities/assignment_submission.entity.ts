import { ApiProperty } from '@nestjs/swagger';
import {
  AssignmentSubmissionStatusMap,
  AssignmentSubmissionStatusValues,
} from '@/common/utils/course.map';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('assignment_submission')
export class AssignmentSubmission {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '提交记录ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '作业ID' })
  assignment_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学生ID' })
  student_id: string;

  @Column({
    type: 'tinyint',
    nullable: true,
    default: 0,
  })
  @ApiProperty({
    description: '提交状态: 0-未提交, 1-已提交(待批改), 2-已批改',
    required: false,
    enum: AssignmentSubmissionStatusValues,
    default: AssignmentSubmissionStatusMap.NOT_SUBMITTED,
  })
  status?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 1,
    nullable: true,
    default: 0.0,
  })
  @ApiProperty({ description: '总分', required: false, example: '95.5' })
  total_score?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '教师评语', required: false })
  teacher_comment?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '提交时间戳(s)', required: false })
  submit_time?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '批改时间戳(s)', required: false })
  grade_time?: string;

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
