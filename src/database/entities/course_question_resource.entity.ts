import { ApiProperty } from '@nestjs/swagger';
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryColumn } from 'typeorm';
import { v4 } from 'uuid';
import { QuestionResourceTypeMap, QuestionResourceTypeValues } from '@/common/utils/assignment.map';

@Entity('course_question_resource')
export class CourseQuestionResource {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '资源ID' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: '关联的题目ID' })
  question_id: string;

  @Column({
    type: 'tinyint',
    default: QuestionResourceTypeMap.STEM_IMAGE,
  })
  @ApiProperty({
    description: '资源类型: 1-题干图片, 2-解析图片',
    enum: QuestionResourceTypeValues,
    default: QuestionResourceTypeMap.STEM_IMAGE,
  })
  resource_type: number;

  @Column({ type: 'varchar', length: 500 })
  @ApiProperty({ description: '文件的相对路径' })
  file_url: string;

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
