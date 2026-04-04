import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeforeInsert, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_student')
@Index('uk_course_student', ['course_id', 'student_id'], { unique: true })
export class CourseStudent {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '关联ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学生ID' })
  student_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '学生加入的教学组ID' })
  group_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '加入时间戳(s)' })
  create_time?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiPropertyOptional({ description: '已完成课时数' })
  completed_lesson_count?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  @ApiPropertyOptional({ description: '学习进度百分比' })
  progress_percent?: number;

  @BeforeInsert()
  setCreateFields() {
    if (!this.id) {
      this.id = v4();
    }
    this.create_time = String(Math.floor(Date.now() / 1000));
  }
}
