import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../notifications/sms.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: { select: { smsCredits: true } },
        creditGrantsReceived: {
          select: { credits: true, grantedByEmail: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return users.map((user) => {
      const lastGrant = user.creditGrantsReceived[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        smsCredits: user.subscription?.smsCredits ?? 0,
        lastGrant: lastGrant
          ? {
              credits: lastGrant.credits,
              grantedByEmail: lastGrant.grantedByEmail,
              createdAt: lastGrant.createdAt,
            }
          : null,
      };
    });
  }

  async grantCredits(
    userId: string,
    credits: number,
    grantedBy: { id: string; email: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        visas: {
          select: { phoneNumber: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          provider: 'admin-grant',
          status: 'active',
          active: true,
          smsCredits: credits,
        },
        update: {
          smsCredits: { increment: credits },
        },
      });

      await tx.creditGrant.create({
        data: {
          recipientId: userId,
          grantedById: grantedBy.id,
          grantedByEmail: grantedBy.email,
          credits,
        },
      });

      return updated;
    });

    const totalCredits = subscription.smsCredits;
    const phone = user.visas[0]?.phoneNumber?.trim() || '';

    const emailResult = await this.notifyByEmail(
      user.email,
      user.name,
      credits,
      totalCredits,
    );
    const smsResult = await this.notifyBySms(phone, user.name, credits);

    return {
      userId,
      creditsGranted: credits,
      totalCredits,
      grantedBy: { id: grantedBy.id, email: grantedBy.email },
      notifications: { email: emailResult, sms: smsResult },
    };
  }

  private async notifyByEmail(
    to: string,
    name: string,
    credits: number,
    totalCredits: number,
  ): Promise<{ sent: boolean; reason?: string }> {
    if (!to) {
      return { sent: false, reason: 'no_email' };
    }
    try {
      await this.emailService.sendCreditGrantEmail({
        to,
        name,
        credits,
        totalCredits,
      });
      return { sent: true };
    } catch (error) {
      this.logger.error(`Failed to send credit-grant email to ${to}`);
      return { sent: false, reason: 'send_failed' };
    }
  }

  private async notifyBySms(
    phone: string,
    name: string,
    credits: number,
  ): Promise<{ sent: boolean; reason?: string }> {
    if (!phone) {
      return { sent: false, reason: 'no_phone' };
    }
    try {
      await this.smsService.sendSms(
        phone,
        `This is VisaRemindPH: Hi ${name}, ${credits} SMS credit${
          credits === 1 ? '' : 's'
        } have been added to your account by our team.`,
      );
      return { sent: true };
    } catch (error) {
      this.logger.error(`Failed to send credit-grant SMS to ${phone}`);
      return { sent: false, reason: 'send_failed' };
    }
  }
}
