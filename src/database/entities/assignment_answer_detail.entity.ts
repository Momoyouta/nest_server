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

@Entity('assignment_answer_detail')
export class AssignmentAnswerDetail {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '明细ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '提交记录ID' })
  submission_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '题目ID' })
  question_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学生ID' })
  student_id: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: '学生答案(JSON)',
    required: false,
    example: { value: 'A' },
  })
  student_answer?: Record<string, any> | Array<any>;

  @Column({ type: 'tinyint', nullable: true, default: BinaryFlagMap.NO })
  @ApiProperty({
    description: '客观题自动判分结果: 0-错, 1-对',
    required: false,
    enum: BinaryFlagValues,
    default: BinaryFlagMap.NO,
  })
  is_correct?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 1,
    nullable: true,
    default: 0.0,
  })
  @ApiProperty({ description: '得分', required: false, example: '5.0' })
  score?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '教师评语', required: false })
  teacher_comment?: string;

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
