import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { AppException } from '../common/exceptions/app.exception';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  const lead = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    status: 'new',
  };

  const createLeadDto = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '9999999999',
    status: 'new' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByCustomField: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getNotes: jest.fn(),
            addNote: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    service = module.get<LeadsService>(LeadsService);
  });

  describe('POST /api/leads', () => {
    it('creates a lead through the service', async () => {
      (service.create as jest.Mock).mockResolvedValue(lead);

      await expect(controller.create(createLeadDto)).resolves.toBe(lead);
      expect(service.create).toHaveBeenCalledWith(createLeadDto);
    });
  });

  describe('GET /api/leads', () => {
    it('lists leads paginated when no search term is given', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [lead], total: 1 });

      await expect(controller.findAll(undefined, '2', '10')).resolves.toEqual({
        data: [lead],
        total: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith(2, 10);
      expect(service.findByCustomField).not.toHaveBeenCalled();
    });

    it('searches by the given term', async () => {
      (service.findByCustomField as jest.Mock).mockResolvedValue([lead]);

      await expect(controller.findAll('test', '0', '10')).resolves.toEqual([lead]);
      expect(service.findByCustomField).toHaveBeenCalledWith('test', 0, 10);
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('defaults offset and limit when not given', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await controller.findAll(undefined, undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('returns the lead', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(lead);

      await expect(controller.findOne('1')).resolves.toBe(lead);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('throws a 404 AppException when the lead does not exist', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(null);

      let caught: AppException;
      try {
        await controller.findOne('999');
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect(caught.getStatus()).toBe(404);
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('updates the lead through the service', async () => {
      (service.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(controller.update('1', { status: 'contacted' })).resolves.toEqual({
        affected: 1,
      });
      expect(service.update).toHaveBeenCalledWith(1, { status: 'contacted' });
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('deletes the lead through the service', async () => {
      (service.remove as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(controller.remove('1')).resolves.toEqual({ affected: 1 });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('notes routes', () => {
    it('lists notes for the lead paginated', async () => {
      (service.getNotes as jest.Mock).mockResolvedValue({
        data: [{ id: 1, content: 'hello' }],
        total: 1,
      });

      await expect(controller.findNotesByLeadId('1', '0', '10')).resolves.toEqual({
        data: [{ id: 1, content: 'hello' }],
        total: 1,
      });
      expect(service.getNotes).toHaveBeenCalledWith(1, 0, 10);
    });

    it('adds a note through the service', async () => {
      (service.addNote as jest.Mock).mockResolvedValue({ id: 1, content: 'hello' });

      await expect(controller.createNotes('1', { content: 'hello' })).resolves.toEqual({
        id: 1,
        content: 'hello',
      });
      expect(service.addNote).toHaveBeenCalledWith(1, { content: 'hello' });
    });
  });
});
