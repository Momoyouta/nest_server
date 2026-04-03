import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invitation_code')
export class InvitationCode {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '主键ID' })
  id: number;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ description: '邀请码' })
  code: string;

  @Column({ type: 'int', nullable: true })
  @ApiPropertyOptional({ description: '邀请码类型' })
  type: number;

  @Column({ name: 'school_id', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '学校ID' })
  school_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '年级' })
  grade: string;

  @Column({ name: 'class_id', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '班级ID' })
  class_id: string;

  @Column({ name: 'course_id', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '课程ID' })
  course_id: string;

  @Column({
    name: 'teaching_group_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @ApiPropertyOptional({ description: '教学组ID' })
  teaching_group_id?: string;

  @Column({ name: 'creater_id', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '创建者ID' })
  creater_id: string;

  @Column({ name: 'create_time', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ description: '创建时间戳(s)' })
  create_time: string;

  @Column({ type: 'bigint', nullable: true })
  @ApiPropertyOptional({ description: '有效时长(s)' })
  ttl: number;
}
