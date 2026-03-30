import { ApiProperty } from '@nestjs/swagger';
import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_teacher')
export class CourseTeacher {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '关联ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教师ID' })
  teacher_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '创建时间戳(s)', required: false })
  create_time?: string;

  @BeforeInsert()
  setCreateFields() {
    if (!this.id) {
      this.id = v4();
    }
    this.create_time = String(Math.floor(Date.now() / 1000));
  }
}
