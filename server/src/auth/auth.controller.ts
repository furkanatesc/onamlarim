import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, PublicUser, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.login(dto);
  }
}
