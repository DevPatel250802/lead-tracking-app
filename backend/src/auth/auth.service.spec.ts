import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { AppException } from '../common/exceptions/app.exception';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const user = {
    id: 1,
    email: 'admin@example.com',
    password: 'hashed-password',
    role: 'ADMIN',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('seedAdmin', () => {
    it('seeds the admin user when it does not exist', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-admin123');
      (userRepository.create as jest.Mock).mockReturnValue({
        email: 'admin@example.com',
        password: 'hashed-admin123',
        role: 'ADMIN',
      });

      await service.seedAdmin();

      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', 10);
      expect(userRepository.save).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'hashed-admin123',
        role: 'ADMIN',
      });
    });

    it('does nothing when the admin already exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);

      await service.seedAdmin();

      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws a 401 AppException when the email is unknown', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      let caught: AppException;
      try {
        await service.login({ email: 'nobody@example.com', password: 'admin123' });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect(caught.getStatus()).toBe(401);
    });

    it('throws a 401 AppException when the password is wrong', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      let caught: AppException;
      try {
        await service.login({ email: 'admin@example.com', password: 'wrong' });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect(caught.getStatus()).toBe(401);
    });

    it('returns the signed access token for valid credentials', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('signed-token');

      await expect(
        service.login({ email: 'admin@example.com', password: 'admin123' }),
      ).resolves.toEqual({ access_token: 'signed-token' });
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', 'hashed-password');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });
  });
});
