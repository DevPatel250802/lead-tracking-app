import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('logs in through the service and returns the token', async () => {
    (service.login as jest.Mock).mockResolvedValue({ access_token: 'signed-token' });
    const dto = { email: 'admin@example.com', password: 'admin123' };

    await expect(controller.create(dto)).resolves.toEqual({ access_token: 'signed-token' });
    expect(service.login).toHaveBeenCalledWith(dto);
  });
});
