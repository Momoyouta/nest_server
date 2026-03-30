import { ApiProperty } from '@nestjs/swagger';
import { CourseStatusMap, CourseStatusValues } from '@/common/utils/course.map';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';

@Entity('course')
export class Course {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '学校ID' })
  school_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '创建人ID' })
  creator_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程名称' })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: '课程封面图', required: false })
  cover_img?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '课程描述', required: false })
  description?: string;

  @Column({ type: 'tinyint', nullable: true, default: CourseStatusMap.UNPUBLISHED })
  @ApiProperty({
    description: '课程状态: 0-未发布, 1-已发布',
    required: false,
    enum: CourseStatusValues,
    default: CourseStatusMap.UNPUBLISHED,
  })
  status?: number;

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
