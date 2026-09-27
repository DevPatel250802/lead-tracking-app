import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { Repository } from 'typeorm';
import { LeadMapper } from './utils/lead-mapping';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note } from './entities/note.entity';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class LeadsService {

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Note)
    private readonly NoteRepository: Repository<Note>

  ) { }

  async create(createLeadDto: CreateLeadDto) {
    const lead = this.leadRepository.create(
      LeadMapper.toLeadEntity(createLeadDto),
    );
    const savedLead = await this.leadRepository.save(lead);
    return savedLead;
  }

  async findAll(offset: number, limit: number,) {
    const [leads,count] = await this.leadRepository.findAndCount(
      {
        skip: offset * limit,
        take: limit
      }
    );
    return {
      data : leads,
      total: count
    };
  }

  async findOne(id: number) {
    const leadById = await this.leadRepository.findOneBy({ id })
    console.log(leadById);
    return leadById;
  }

  async update(id: number, updateLeadDto: UpdateLeadDto) {
    const updatedLead = await this.leadRepository.update(id, updateLeadDto);
    return updatedLead;
  }

  async remove(id: number) {
    const deletedLead = await this.leadRepository.delete(id);
    return deletedLead;
  }

  async addNote(id: number, createNoteDto: CreateNoteDto) {

    const note = this.NoteRepository.create(
      LeadMapper.toNoteEntity(createNoteDto),
    );
    const lead = await this.findOne(id);
    if (!lead) {
      throw new AppException(
        `lead not found for given id : ${id}`,
        'LEAD_NOT_FOUND',
        HttpStatus.NOT_FOUND
      );
    }
    note.lead = lead;
    console.log("note -> addNote :", note);
    return this.NoteRepository.save(note);
  }

  async getNotes(id: number , offset : number , limit : number) {
    const [notesByLead, count] = await this.NoteRepository.findAndCount({
      where: {
        lead: {
          id
        }
      },
      skip: offset * limit,
      take: limit
    });
    console.log(notesByLead);
    return { data: notesByLead, total: count };
  }

  async findByCustomField(search: string, offset: number, limit: number,) {
    const query = ` select * from lead where name like lower(?) or email like lower(?) order by name asc limit ? offset ?`;
    const leads = await this.leadRepository.query(query, [`%${search}%`, `%${search}%`, limit, offset]);
    console.log("search --> ", leads);
    return leads;
  }
}
