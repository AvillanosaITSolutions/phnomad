import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TestSmsDto } from './dto/test-sms.dto';
import { TestEmailDto } from './dto/test-email.dto';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  getLogs(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getNotificationLogsForUser(user.sub);
  }

  @Post('test-sms')
  testSms(@Body() dto: TestSmsDto) {
    return this.notificationsService.sendTestSms(
      dto.to,
      dto.country,
      new Date(dto.expiryDate),
    );
  }

  @Post('test-email')
  testEmail(@Body() dto: TestEmailDto) {
    return this.notificationsService.sendTestEmail(
      dto.to,
      dto.country,
      dto.visaType,
      new Date(dto.expiryDate),
    );
  }

  @Post('send-now')
  sendNow(@CurrentUser() user: AuthUser) {
    return this.notificationsService.sendImmediateRemindersForUser(user.sub);
  }
}
