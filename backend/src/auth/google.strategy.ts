import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    const clientID = configService.get<string>('googleClientId') ?? '';
    const clientSecret = configService.get<string>('googleClientSecret') ?? '';
    const callbackURL = configService.get<string>('googleCallbackUrl') ?? '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      passReqToCallback: true,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    req: unknown,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile?.emails?.[0]?.value;
    const name = profile?.displayName ?? email;
    const googleId = profile?.id;

    const adminEmails = new Set(
      String(process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );

    const user = await this.usersService.upsertGoogleUser({
      email,
      googleId,
      name,
      role: adminEmails.has(String(email).toLowerCase())
        ? UserRole.ADMIN
        : undefined,
    });

    done(null, user);
  }
}
