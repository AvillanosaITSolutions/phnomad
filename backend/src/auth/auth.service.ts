import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  name?: string;
  aud: string;
}

interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithGoogle(idToken: string): Promise<{ accessToken: string }> {
    const googleClientId = this.configService.get<string>(
      'googleClientId',
    ) as string;
    const adminEmails = new Set(
      ((this.configService.get<string[]>('adminEmails') as string[]) ?? [])
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    );
    let data: GoogleTokenInfo;
    try {
      const response = await axios.get<GoogleTokenInfo>(
        'https://oauth2.googleapis.com/tokeninfo',
        { params: { id_token: idToken } },
      );
      data = response.data;
    } catch {
      throw new HttpException('Invalid Google token', HttpStatus.UNAUTHORIZED);
    }

    if (data.aud !== googleClientId) {
      throw new HttpException(
        'Invalid Google token audience',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersService.upsertGoogleUser({
      email: data.email,
      googleId: data.sub,
      name: data.name ?? data.email,
      role: adminEmails.has(data.email.toLowerCase())
        ? UserRole.ADMIN
        : undefined,
    });

    return this.issueAccessToken(user);
  }

  async issueAccessToken(user: User): Promise<{ accessToken: string }> {
    const accessToken = await this.jwtService.signAsync<AuthTokenPayload>({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { accessToken };
  }
}
