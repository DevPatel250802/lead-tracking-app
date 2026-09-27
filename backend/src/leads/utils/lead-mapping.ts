import { CreateLeadDto } from "../dto/create-lead.dto";
import { CreateNoteDto } from "../dto/create-note.dto";
import { Lead } from "../entities/lead.entity";
import { Note } from "../entities/note.entity";

export class LeadMapper {


    static toLeadEntity(createLeadDto: CreateLeadDto): Partial<Lead> {
        return {
            name : createLeadDto.name,
            email : createLeadDto.email,
            phone : createLeadDto.phone,
            status : createLeadDto.status
        }
    }

    static toNoteEntity(createNoteDto : CreateNoteDto) : Partial<Note> {
          return {
              content: createNoteDto.content,  
          }  
    }

}