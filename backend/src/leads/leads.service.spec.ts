import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { LeadsService } from './leads.service';
import { Lead } from './entities/lead.entity';
import { Note } from './entities/note.entity';
import { AppException } from '../common/exceptions/app.exception';

describe('LeadsService', () => {
  let service: LeadsService;
  let leadRepository: Repository<Lead>;
  let noteRepository: Repository<Note>;

  const lead = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    status: 'new',
  } as Lead;

  const createLeadDto = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    status: 'new' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Note),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    leadRepository = module.get<Repository<Lead>>(getRepositoryToken(Lead));
    noteRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves and returns the new lead', async () => {
      (leadRepository.create as jest.Mock).mockReturnValue(lead);
      (leadRepository.save as jest.Mock).mockResolvedValue(lead);

      await expect(service.create(createLeadDto)).resolves.toBe(lead);
      expect(leadRepository.save).toHaveBeenCalledWith(lead);
    });
  });

  describe('findAll', () => {
    it('returns page data with the total, skipping offset x limit', async () => {
      (leadRepository.findAndCount as jest.Mock).mockResolvedValue([[lead], 15]);

      await expect(service.findAll(2, 10)).resolves.toEqual({ data: [lead], total: 15 });
      expect(leadRepository.findAndCount).toHaveBeenCalledWith({ skip: 20, take: 10 });
    });
  });

  describe('findOne', () => {
    it('returns the lead when it exists', async () => {
      (leadRepository.findOneBy as jest.Mock).mockResolvedValue(lead);

      await expect(service.findOne(1)).resolves.toBe(lead);
      expect(leadRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns null when it does not exist', async () => {
      (leadRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates the lead by id', async () => {
      (leadRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(service.update(1, { status: 'contacted' })).resolves.toEqual({ affected: 1 });
      expect(leadRepository.update).toHaveBeenCalledWith(1, { status: 'contacted' });
    });
  });

  describe('remove', () => {
    it('deletes the lead by id', async () => {
      (leadRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(service.remove(1)).resolves.toEqual({ affected: 1 });
      expect(leadRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('addNote', () => {
    it('throws a 404 AppException when the lead does not exist', async () => {
      (leadRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      let caught: AppException;
      try {
        await service.addNote(999, { content: 'hello' });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect(caught.getStatus()).toBe(404);
      expect(noteRepository.save).not.toHaveBeenCalled();
    });

    it('saves the note linked to the lead', async () => {
      (leadRepository.findOneBy as jest.Mock).mockResolvedValue(lead);
      const note = { id: 1, content: 'hello', lead: undefined };
      (noteRepository.create as jest.Mock).mockReturnValue(note);
      (noteRepository.save as jest.Mock).mockResolvedValue(note);

      await expect(service.addNote(1, { content: 'hello' })).resolves.toBe(note);
      expect(note.lead).toBe(lead);
      expect(noteRepository.save).toHaveBeenCalledWith(note);
    });
  });

  describe('getNotes', () => {
    it('returns the notes page with the total', async () => {
      const notes = [{ id: 1, content: 'hello' }];
      (noteRepository.findAndCount as jest.Mock).mockResolvedValue([notes, 15]);

      await expect(service.getNotes(1, 1, 10)).resolves.toEqual({ data: notes, total: 15 });
      expect(noteRepository.findAndCount).toHaveBeenCalledWith({
        where: { lead: { id: 1 } },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('findByCustomField', () => {
    it('runs the search query with like patterns', async () => {
      (leadRepository.query as jest.Mock).mockResolvedValue([lead]);

      await expect(service.findByCustomField('test', 0, 10)).resolves.toEqual([lead]);
      expect(leadRepository.query).toHaveBeenCalledWith(expect.any(String), [
        '%test%',
        '%test%',
        10,
        0,
      ]);
    });
  });
});
