import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeforeInsert, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_group_teacher')
@Index('uk_group_teacher', ['group_id', 'teacher_id'], { unique: true })
export class CourseGroupTeacher {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '关联ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教学组ID' })
  group_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教师ID' })
  teacher_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time?: string;

  @BeforeInsert()
  setCreateFields() {
    if (!this.id) {
      this.id = v4();
    }
    this.create_time = String(Math.floor(Date.now() / 1000));
  }
}
