import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

const packageIds = [
  'starter-100',
  'core-250',
  'plus-500',
  'growth-1000',
  'scale-2500',
] as const;

class CreateTopUpCheckoutDto {
  @IsString()
  @IsIn(packageIds)
  packageId!: (typeof packageIds)[number];

  @IsString()
  @IsIn(['send_to_one', 'send_to_many'])
  sendMode!: 'send_to_one' | 'send_to_many';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmailRecipients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccSmsRecipients?: string[];
}

class PayMongoWebhookDto {
  @IsOptional()
  @IsObject()
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          amount?: number;
          metadata?: Record<string, unknown>;
          checkout_session_id?: string;
        };
        metadata?: Record<string, unknown>;
      };
      metadata?: Record<string, unknown>;
    };
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getForUser(user.sub);
  }

  @Post('topup/checkout')
  @UseGuards(JwtAuthGuard)
  createTopUpCheckout(
    @CurrentUser() user: AuthUser,
    @Body() payload: CreateTopUpCheckoutDto,
  ) {
    return this.subscriptionsService.createTopUpCheckout(
      user.sub,
      payload.packageId,
      payload.sendMode,
      payload.ccEmailRecipients,
      payload.ccSmsRecipients,
    );
  }

  @Post('paymongo/webhook')
  paymongoWebhook(
    @Body() payload: PayMongoWebhookDto,
    @Headers('authorization') authHeader?: string,
    @Query('token') token?: string,
  ) {
    return this.subscriptionsService.applyTopUpWebhook(
      payload,
      authHeader,
      token,
    );
  }
}
