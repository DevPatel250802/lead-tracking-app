import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { Note } from './entities/note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Note]), // this will automatically genrate the repositories for Lead and notes.
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
