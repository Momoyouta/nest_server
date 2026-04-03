import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeforeInsert, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_teaching_group')
@Index('idx_course_id', ['course_id'])
export class CourseTeachingGroup {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教学组ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '归属课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '教学组名称' })
  name: string;

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
