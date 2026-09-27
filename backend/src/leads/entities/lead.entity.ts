import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { LeadStatus } from '../enums/lead-status-enum';
import { Note } from './note.entity';

@Entity()
export class Lead {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    phone: string;


    @Column({
        type: 'text',
        default: LeadStatus.NEW
    })
    status: LeadStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Note, (note) => note.lead)
    notes: Note[];
}
