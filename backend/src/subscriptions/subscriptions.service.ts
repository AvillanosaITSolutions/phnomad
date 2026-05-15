import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhToLocalMobile } from '../common/phone.util';

type TopUpPackage = {
  id: string;
  name: string;
  credits: number;
  amountPhp: number;
};

const TOPUP_PACKAGES: TopUpPackage[] = [
  { id: 'starter-100', name: 'Starter', credits: 100, amountPhp: 79 },
  { id: 'core-250', name: 'Core', credits: 250, amountPhp: 169 },
  { id: 'plus-500', name: 'Plus', credits: 500, amountPhp: 319 },
  { id: 'growth-1000', name: 'Growth', credits: 1000, amountPhp: 549 },
  { id: 'scale-2500', name: 'Scale', credits: 2500, amountPhp: 1199 },
];

function getTopUpPackage(packageId: string): TopUpPackage | undefined {
  return TOPUP_PACKAGES.find((item) => item.id === packageId);
}

type PayMongoWebhookPayload = {
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
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getForUser(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async createTopUpCheckout(
    userId: string,
    packageId: string,
    sendMode: 'send_to_one' | 'send_to_many',
    ccEmailRecipients?: string[],
    ccSmsRecipients?: string[],
  ) {
    const topUpPackage = getTopUpPackage(packageId);
    if (!topUpPackage) {
      throw new BadRequestException('Invalid packageId');
    }

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
      throw new BadRequestException('User not found');
    }

    const visaPhone = user.visas[0]?.phoneNumber?.trim() || '';
    const phone = normalizePhToLocalMobile(visaPhone) ?? undefined;
    const cleanedCcEmails = (ccEmailRecipients ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
    const cleanedCcSms = (ccSmsRecipients ?? [])
      .map((value) => value.trim())
      .filter(Boolean);

    const payMongoSecretKey =
      this.configService.get<string>('payMongoSecretKey');
    if (!payMongoSecretKey) {
      throw new InternalServerErrorException('Missing PAYMONGO_SECRET_KEY');
    }

    const frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:5173';
    const authValue = Buffer.from(`${payMongoSecretKey}:`).toString('base64');

    const requestBody = {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          payment_method_types: ['qrph', 'gcash'],
          customer_email: user.email,
          billing: {
            name: user.name,
            email: user.email,
            phone,
          },
          line_items: [
            {
              currency: 'PHP',
              amount: topUpPackage.amountPhp * 100,
              name: `${topUpPackage.credits} SMS credits`,
              quantity: 1,
            },
          ],
          description: `Top-up ${topUpPackage.credits} SMS credits`,
          success_url: `${frontendUrl}/topup?topup=success`,
          cancel_url: `${frontendUrl}/topup?topup=cancel`,
          metadata: {
            userId,
            packageId: topUpPackage.id,
            credits: topUpPackage.credits,
            sendMode,
            ccEmailRecipients: cleanedCcEmails,
            ccSmsRecipients: cleanedCcSms,
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: phone ?? '',
          },
        },
      },
    };

    const response = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      requestBody,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Basic ${authValue}`,
        },
      },
    );

    const checkoutUrl = response.data?.data?.attributes?.checkout_url as
      | string
      | undefined;
    const checkoutSessionId = response.data?.data?.id as string | undefined;

    if (!checkoutUrl || !checkoutSessionId) {
      throw new InternalServerErrorException(
        'PayMongo checkout URL was not returned',
      );
    }

    return {
      checkoutUrl,
      checkoutSessionId,
      packageId: topUpPackage.id,
      credits: topUpPackage.credits,
      amountPhp: topUpPackage.amountPhp,
    };
  }

  async applyTopUpWebhook(
    payload: PayMongoWebhookPayload,
    authHeader?: string,
    tokenFromQuery?: string,
  ) {
    console.log('PayMongo webhook received:', JSON.stringify(payload, null, 2));
    this.validateWebhookAuth(authHeader, tokenFromQuery);

    const eventType = payload.data?.attributes?.type ?? '';
    console.log('Event type:', eventType);
    if (!eventType.includes('paid')) {
      console.log('Unsupported event type, returning');
      return { applied: false, reason: 'unsupported_event' };
    }

    const resource = payload.data?.attributes?.data;
    const metadata =
      resource?.attributes?.metadata ??
      resource?.metadata ??
      payload.data?.attributes?.metadata ??
      {};

    const userId = String(metadata.userId ?? '');
    const packageId = String(metadata.packageId ?? '');
    const topUpPackage = getTopUpPackage(packageId);

    console.log('Metadata extracted:', {
      userId,
      packageId,
      topUpPackage: topUpPackage?.id,
    });
    if (!userId || !topUpPackage) {
      console.log('Missing userId or topUpPackage, returning');
      return { applied: false, reason: 'missing_metadata' };
    }

    const paymongoPaymentId =
      resource?.id ??
      payload.data?.id ??
      `${userId}:${packageId}:${Date.now().toString()}`;
    const checkoutSessionId =
      resource?.attributes?.checkout_session_id ?? payload.data?.id ?? null;

    console.log(
      'Looking for existing transaction with paymongoPaymentId:',
      paymongoPaymentId,
    );
    const existing = await this.prisma.topUpTransaction.findUnique({
      where: { paymongoPaymentId },
    });
    if (existing) {
      console.log('Duplicate transaction found, skipping');
      return { applied: false, reason: 'duplicate' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.topUpTransaction.create({
        data: {
          userId,
          packageId: topUpPackage.id,
          paymongoPaymentId,
          checkoutSessionId,
          amountPhp: topUpPackage.amountPhp,
          credits: topUpPackage.credits,
          status: 'paid',
        },
      });

      await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          provider: 'paymongo',
          status: 'active',
          active: true,
          smsCredits: topUpPackage.credits,
        },
        update: {
          provider: 'paymongo',
          status: 'active',
          active: true,
          smsCredits: { increment: topUpPackage.credits },
        },
      });
    });

    console.log('Webhook processed successfully:', {
      applied: true,
      userId,
      packageId: topUpPackage.id,
      creditsAdded: topUpPackage.credits,
    });
    return {
      applied: true,
      userId,
      packageId: topUpPackage.id,
      creditsAdded: topUpPackage.credits,
    };
  }

  private validateWebhookAuth(authHeader?: string, tokenFromQuery?: string) {
    const expected = this.configService.get<string>('payMongoWebhookAuth');
    if (!expected) {
      console.warn('PAYMONGO_WEBHOOK_AUTH not configured, skipping validation');
      return;
    }

    const provided = authHeader?.trim();
    const token = tokenFromQuery?.trim();
    const isBearerMatch = provided === `Bearer ${expected}`;
    const isQueryTokenMatch = token === expected;

    console.log('Webhook auth check:', {
      hasAuth: !!expected,
      authHeaderProvided: !!authHeader,
      tokenProvided: !!tokenFromQuery,
      isBearerMatch,
      isQueryTokenMatch,
    });

    if (!isBearerMatch && !isQueryTokenMatch) {
      throw new UnauthorizedException('Invalid webhook authorization');
    }
  }
}
