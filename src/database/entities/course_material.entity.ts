import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { v4 } from 'uuid';

@Entity('course_material')
export class CourseMaterial {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '主键ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '归属课程ID' })
  course_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '资源库文件ID' })
  file_id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '上传者ID' })
  uploader_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '绑定时间戳(s)', required: false })
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
