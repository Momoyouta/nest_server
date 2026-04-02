import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('teacher')
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '教师ID' })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '工号' })
  teacher_number: string;

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
