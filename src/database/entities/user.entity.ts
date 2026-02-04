import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';
import { v4 } from 'uuid';
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    role_id: string;

    @Column({ default: false })
    sex: boolean;

    @Column()
    account: string;

    @Column()
    password: string;

    // 在实体中定义生成 UUID 的方法
    static generateId(): string {
        return v4();
    }

    // 可选：使用 BeforeInsert 装饰器自动生成 UUID
    @BeforeInsert()
    generateId() {
      if (!this.id) {
        this.id = v4();
      }
    }
}