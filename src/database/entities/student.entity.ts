import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '学生ID' })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学号' })
  student_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '班级id' })
  class_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学院' })
  college: string;

  @Column()
  @ApiProperty({ description: '所属用户ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学校ID', required: false })
  school_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
