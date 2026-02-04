import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    nameEN: string;

    @Column()
    nameCN: string;

    @Column({ default: 0 })
    level: number;
}