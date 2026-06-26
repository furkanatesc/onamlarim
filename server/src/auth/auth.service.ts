import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { env } from '../config/env';

export interface PublicUser { id: string; email: string; name: string; role: Role; }
export interface Tokens { accessToken: string; refreshToken: string; }

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.users.create({ email: dto.email, password: dto.password, name: dto.name });
    return toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await this.users.verifyPassword(user, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.signTokens(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async signTokens(user: { id: string; email: string; role: Role }): Promise<Tokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: env.jwtAccessSecret, expiresIn: '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: env.jwtRefreshSecret, expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
