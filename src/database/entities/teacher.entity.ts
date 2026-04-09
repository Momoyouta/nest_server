import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './user.entity';
import { College } from './college.entity';
import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';

@Entity('teacher')
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '教师ID' })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '工号' })
  teacher_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学院ID' })
  college_id: string;

  @Column()
  @ApiProperty({ description: '所属用户ID' })
  user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: '学校ID', required: false })
  school_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '创建时间戳 (s)', required: false })
  create_time: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '更新时间戳 (s)', required: false })
  update_time: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => College)
  @JoinColumn({ name: 'college_id' })
  college: College;

  @BeforeInsert()
  generateIdAndCreateTime() {
    if (!this.id) {
      this.id = v4();
    }
    const now = String(Math.floor(Date.now() / 1000));
    this.create_time = now;
    this.update_time = now;
  }

  @BeforeUpdate()
  updateUpdateTime() {
    this.update_time = String(Math.floor(Date.now() / 1000));
  }
}
