import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_chapter')
export class CourseChapter {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '章节ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '章节标题' })
  title: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '排序值', default: 0 })
  sort_order: number;

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
