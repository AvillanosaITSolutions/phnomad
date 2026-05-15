import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface UpsertGoogleUserInput {
  email: string;
  googleId: string;
  name: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  upsertGoogleUser(input: UpsertGoogleUserInput): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        googleId: input.googleId,
        name: input.name,
        role: input.role ?? UserRole.CUSTOMER,
      },
      update: {
        googleId: input.googleId,
        name: input.name,
        role: input.role ?? UserRole.CUSTOMER,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
