import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const returnOrigin = String(
      request?.query?.returnOrigin || request?.query?.state || '',
    ).trim();

    return {
      prompt: 'select_account',
      ...(returnOrigin ? { state: returnOrigin } : {}),
    };
  }
}
