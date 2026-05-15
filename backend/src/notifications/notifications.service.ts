import { Injectable, Logger } from '@nestjs/common';
import { NotificationStatus, NotificationType, Visa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async sendReminder(
    visa: Visa,
    daysLeft: number,
    options?: { force?: boolean },
  ): Promise<void> {
    const force = options?.force ?? false;
    const expiryCycleKey = visa.expiryDate.toISOString().slice(0, 10);
    const dayTag = force
      ? `manual-${new Date().toISOString()}`
      : daysLeft >= 0
        ? `${daysLeft}d:${expiryCycleKey}`
        : `expired:${expiryCycleKey}`;

    if (visa.smsEnabled) {
      const sentAlready = force
        ? false
        : await this.wasAlreadySent(visa.id, NotificationType.SMS, dayTag);
      if (!sentAlready) {
        const message =
          daysLeft >= 0
            ? `This is VisaRemindPH: Your ${visa.country} visa expires in ${daysLeft} days on ${visa.expiryDate.toDateString()}.`
            : `This is VisaRemindPH: Your ${visa.country} visa expires today (${visa.expiryDate.toDateString()}).`;

        const reserved = await this.reserveSmsCredit(visa.userId);
        if (!reserved) {
          this.logger.warn(
            `Skipping SMS reminder for visa ${visa.id} due to zero credit balance`,
          );
          await this.prisma.notificationLog.create({
            data: {
              visaId: visa.id,
              type: NotificationType.SMS,
              status: NotificationStatus.FAILED,
              provider: `philsms:insufficient-credit:${dayTag}`,
            },
          });
        } else {
          try {
            await this.smsService.sendSms(visa.phoneNumber, message);
            await this.prisma.notificationLog.create({
              data: {
                visaId: visa.id,
                type: NotificationType.SMS,
                status: NotificationStatus.SENT,
                provider: `philsms:${dayTag}`,
              },
            });
          } catch (error) {
            await this.refundSmsCredit(visa.userId);
            this.logger.error(`Failed to send SMS for visa ${visa.id}`);
            await this.prisma.notificationLog.create({
              data: {
                visaId: visa.id,
                type: NotificationType.SMS,
                status: NotificationStatus.FAILED,
                provider: `philsms:${dayTag}`,
              },
            });
          }
        }
      }
    }

    if (visa.emailEnabled) {
      const sentAlready = force
        ? false
        : await this.wasAlreadySent(visa.id, NotificationType.EMAIL, dayTag);
      if (!sentAlready) {
        await this.trySend(
          () =>
            this.emailService.sendVisaReminderEmail({
              to: visa.email,
              daysLeft: Math.max(daysLeft, 0),
              expiryDate: visa.expiryDate,
              country: visa.country,
              visaType: visa.visaType,
            }),
          visa.id,
          NotificationType.EMAIL,
          `smtp:${dayTag}`,
        );
      }
    }
  }

  async sendImmediateRemindersForUser(
    userId: string,
  ): Promise<{ success: true; processed: number }> {
    const visas = await this.prisma.visa.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;
    for (const visa of visas) {
      const daysLeft = Math.ceil((visa.expiryDate.getTime() - now) / msPerDay);
      await this.sendReminder(visa, daysLeft, { force: true });
    }

    return { success: true, processed: visas.length };
  }

  async getNotificationLogsForUser(userId: string) {
    return this.prisma.notificationLog.findMany({
      where: {
        visa: {
          userId,
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 20,
      include: {
        visa: {
          select: {
            id: true,
            country: true,
            visaType: true,
            expiryDate: true,
          },
        },
      },
    });
  }

  async sendTestSms(
    to: string,
    country: string,
    expiryDate: Date,
  ): Promise<{ success: true }> {
    await this.smsService.sendSms(
      to,
      `This is VisaRemindPH: Your ${country} visa expires on ${expiryDate.toDateString()}.`,
    );
    return { success: true };
  }

  async sendTestEmail(
    to: string,
    country: string,
    visaType: string,
    expiryDate: Date,
  ): Promise<{ success: true }> {
    await this.emailService.sendVisaReminderEmail({
      to,
      daysLeft: 7,
      expiryDate,
      country,
      visaType,
    });
    return { success: true };
  }

  private async wasAlreadySent(
    visaId: string,
    type: NotificationType,
    providerTag: string,
  ): Promise<boolean> {
    const existing = await this.prisma.notificationLog.findFirst({
      where: { visaId, type, provider: providerTag },
    });
    return Boolean(existing);
  }

  private async reserveSmsCredit(userId: string): Promise<boolean> {
    const result = await this.prisma.subscription.updateMany({
      where: {
        userId,
        smsCredits: { gt: 0 },
      },
      data: {
        smsCredits: { decrement: 1 },
      },
    });

    return result.count === 1;
  }

  private async refundSmsCredit(userId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { userId },
      data: {
        smsCredits: { increment: 1 },
      },
    });
  }

  private async trySend(
    sendAction: () => Promise<void>,
    visaId: string,
    type: NotificationType,
    provider: string,
  ): Promise<void> {
    try {
      await sendAction();
      await this.prisma.notificationLog.create({
        data: { visaId, type, status: NotificationStatus.SENT, provider },
      });
    } catch (error) {
      this.logger.error(`Failed to send ${type} for visa ${visaId}`);
      await this.prisma.notificationLog.create({
        data: { visaId, type, status: NotificationStatus.FAILED, provider },
      });
    }
  }
}
