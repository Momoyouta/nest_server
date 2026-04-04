import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_lesson')
export class CourseLesson {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课时ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '章节ID' })
  chapter_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '课时标题' })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: '视频资源id', required: false, nullable: true })
  video_path?: string | null;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '排序值', default: 0 })
  sort_order: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: '时长', default: 0 })
  duration: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '课时描述', required: false })
  description?: string;

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
