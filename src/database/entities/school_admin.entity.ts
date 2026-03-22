import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('school_admin')
export class SchoolAdmin {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '学校管理员ID' })
  id: string;


  @Column()
  @ApiProperty({ description: '所属学校ID' })
  school_id: string;

  @Column()
  @ApiProperty({ description: '所属用户ID' })
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
