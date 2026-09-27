import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AppException } from '../common/exceptions/app.exception';
import { CreateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    console.log("controller - > createLeadDto", createLeadDto);
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  async findAll(
    @Query('search') search:string,
    @Query('offset') offset:string = '0',
    @Query('limit') limit:string = '10'
  ) {
    if(search && search.trim()) {
      console.log("inside the controller");
      const leads = await this.leadsService.findByCustomField(search , Number(offset),Number(limit));
      return leads;
    }
    return this.leadsService.findAll(Number(offset),Number(limit));
  }

  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const leadById = await this.leadsService.findOne(+id);
    if (!leadById) {
      throw new AppException(
        `lead not found for given id : ${id}`,
        'LEAD_NOT_FOUND',
        HttpStatus.NOT_FOUND
      );
    }
    return leadById;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.update(+id, updateLeadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.leadsService.remove(+id);
  }

  // NOTES:
  @Get(':id/notes')
  async findNotesByLeadId(
    @Param('id') id: string,
    @Query('offset') offset: string = '0',
    @Query('limit') limit:string = '10'
  ) {
    const notes = await this.leadsService.getNotes(+id, Number(offset), Number(limit));
    return notes;
  }

  @Post(':id/notes')
  createNotes(@Param('id') id: string, @Body() CreateNoteDto: CreateNoteDto) {
    return this.leadsService.addNote(+id, CreateNoteDto);
  }


}
