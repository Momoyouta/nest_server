import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invitation_code')
export class InvitationCode {

  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 16, unique: true, comment: '16位唯一邀请码' })
  code: string;

  @Column({ type: 'tinyint', comment: '0:老师加入学校 1:学生加入学校 2:学生加入课程' })
  type: number;

  @Column({ name: 'school_id' })
  school_id: string;

  @Column({ nullable: true, comment: '入学年份' })
  grade: string;

  @Column({ name: 'class_id', nullable: true })
  class_id: string;

  @Column({ name: 'course_id', nullable: true, comment: '课程id' })
  course_id: string;

  @Column({ name: 'creater_id' })
  creater_id: string;

  @Column({ name: 'create_time' })
  create_time: string;

  @Column({ nullable: true, comment: '时限 (s)' })
  ttl: number;
}
