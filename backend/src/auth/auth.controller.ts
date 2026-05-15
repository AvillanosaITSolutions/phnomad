import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './google-auth.guard';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';

type GoogleRequest = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('google')
  loginWithGoogle(
    @Body() dto: GoogleAuthDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return null;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: GoogleRequest, @Res() res: any) {
    const loginResult = await this.authService.issueAccessToken(
      req.user as User,
    );
    const frontendUrl = new URL(
      '/auth/callback',
      this.configService.get<string>('frontendUrl') as string,
    );
    frontendUrl.searchParams.set('token', loginResult.accessToken);
    frontendUrl.searchParams.set('role', req.user.role);
    return res.redirect(frontendUrl.toString());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.usersService.findById(user.sub);
    return profile;
  }
}
