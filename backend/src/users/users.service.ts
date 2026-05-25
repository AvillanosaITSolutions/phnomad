import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface UpsertGoogleUserInput {
  email: string;
  googleId: string;
  name: string;
  role?: UserRole;
}

const FREE_SIGNUP_CREDITS = 3;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { email: input.email },
        data: {
          googleId: input.googleId,
          name: input.name,
          role: input.role ?? UserRole.CUSTOMER,
        },
      });
    }

    const role = input.role ?? UserRole.CUSTOMER;

    return this.prisma.user.create({
      data: {
        email: input.email,
        googleId: input.googleId,
        name: input.name,
        role,
        ...(role === UserRole.CUSTOMER
          ? {
              subscription: {
                create: {
                  provider: 'signup-bonus',
                  status: 'active',
                  active: true,
                  smsCredits: FREE_SIGNUP_CREDITS,
                },
              },
            }
          : {}),
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
