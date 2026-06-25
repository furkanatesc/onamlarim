import { Test } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';
import { resetDb } from '../../test/setup';

describe('UsersService', () => {
  let service: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UsersService],
    }).compile();
    service = moduleRef.get(UsersService);
  });
  beforeEach(async () => { await resetDb(); });

  it('creates a user with a hashed password (never plaintext)', async () => {
    const user = await service.create({ email: 'a@b.com', password: 'secret123', name: 'Ada' });
    expect(user.email).toBe('a@b.com');
    expect(user.passwordHash).not.toBe('secret123');
    expect(user.passwordHash.startsWith('$argon2')).toBe(true);
  });

  it('finds a user by email and verifies the password', async () => {
    await service.create({ email: 'a@b.com', password: 'secret123', name: 'Ada' });
    const found = await service.findByEmail('a@b.com');
    expect(found).not.toBeNull();
    expect(await service.verifyPassword(found!, 'secret123')).toBe(true);
    expect(await service.verifyPassword(found!, 'wrong')).toBe(false);
  });
});
