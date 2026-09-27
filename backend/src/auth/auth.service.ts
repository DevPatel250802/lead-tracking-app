import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService
    ) { }

    async seedAdmin() {
        const existingUser = await this.userRepository.findOne({
            where: {
                email: 'admin@example.com',
            },
        });

        if (existingUser) {
            return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const user = this.userRepository.create({
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'ADMIN',
        });

        await this.userRepository.save(user);
    }

    async login(loginDto: LoginDto) {
        const user = await this.userRepository.findOne({
            where: {
                email: loginDto.email,
            },
        });

        if (!user) {
            throw new AppException('Invalid credentials', 'UNAUTHORISED', HttpStatus.UNAUTHORIZED);
        }

        const passwordMatches = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!passwordMatches) {
            throw new AppException('Invalid credentials', 'UNAUTHORISED', HttpStatus.UNAUTHORIZED);
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}