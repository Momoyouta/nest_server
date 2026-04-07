import { ApiProperty } from '@nestjs/swagger';
import {
  CourseAssignmentQuestionTypeMap,
  CourseAssignmentQuestionTypeValues,
} from '@/common/utils/course.map';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_assignment_question')
export class CourseAssignmentQuestion {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '题目ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '作业ID' })
  assignment_id: string;

  @Column({ type: 'tinyint' })
  @ApiProperty({
    description: '题型: 1-单选, 2-多选, 3-判断, 4-填空, 5-简答',
    enum: CourseAssignmentQuestionTypeValues,
    example: CourseAssignmentQuestionTypeMap.SINGLE_CHOICE,
  })
  type: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '题目分值', default: 0 })
  score: number;

  @Column({ type: 'json' })
  @ApiProperty({
    description: '题目内容(JSON)',
    example: { stem: '题干', options: [] },
  })
  content: Record<string, any> | Array<any>;

  @Column({ type: 'json' })
  @ApiProperty({ description: '标准答案(JSON)', example: { answer: 'A' } })
  standard_answer: Record<string, any> | Array<any>;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '排序值', default: 0 })
  sort_order: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '题目解析(JSON)', required: false })
  analysis?: Record<string, any> | Array<any>;

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
