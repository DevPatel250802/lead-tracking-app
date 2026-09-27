import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { Lead } from './lead.entity';

@Entity()
export class Note {
    
    @PrimaryGeneratedColumn()
    id : number;

    @ManyToOne(
        () => Lead, (lead) => lead.notes,
        {
            onDelete: 'CASCADE',
        }
    )
    lead : Lead

    @Column()
    content : string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}