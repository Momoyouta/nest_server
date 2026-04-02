import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '姓名' })
  name: string;

  @Column()
  @ApiProperty({ description: '角色ID' })
  role_id: string;

  @Column({ default: false })
  @ApiProperty({ description: '性别' })
  sex: boolean;

  @Column()
  @ApiProperty({ description: '账号' })
  account: string;

  @Column()
  @ApiProperty({ description: '密码' })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '手机号', required: false })
  phone: string;

  @Column()
  @ApiProperty({ description: '头像url' })
  avatar: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '创建时间戳 (s)', required: false })
  create_time: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ description: '更新时间戳 (s)', required: false })
  update_time: string;

  /**
   * 状态 (1: 启用, 2: 禁用/删除)
   */
  @Column({ type: 'smallint', nullable: true, default: 1 })
  @ApiProperty({ description: '状态 (1: 启用, 2: 禁用/删除)', required: false })
  status: number;
  // 在实体中定义生成 UUID 的方法
  static generateId(): string {
    return v4();
  }

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
