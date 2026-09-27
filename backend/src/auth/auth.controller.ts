import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('/login')
    create(@Body() LoginDto: LoginDto) {
        console.log("controller - > LoginDto", LoginDto);
        return this.authService.login(LoginDto);
    }

}
