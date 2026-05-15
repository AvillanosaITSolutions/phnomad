import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { normalizePhToE164 } from '../common/phone.util';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSms(to: string, message: string): Promise<void> {
    const apiUrl = this.configService.get<string>('philSmsApiUrl') as string;
    const apiToken = this.configService.get<string>(
      'philSmsApiToken',
    ) as string;
    const senderId = this.configService.get<string>(
      'philSmsSenderId',
    ) as string;
    const recipient = normalizePhToE164(to);

    if (!recipient) {
      this.logger.error(`Invalid PH phone number format: ${to}`);
      throw new Error('Invalid Philippine mobile number format');
    }

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await axios.post(
          apiUrl,
          { recipient, sender_id: senderId, type: 'plain', message },
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000,
          },
        );
        this.logger.log(
          `SMS sent to ${recipient}: ${JSON.stringify(response.data)}`,
        );
        return;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          this.logger.error(
            `SMS API error for ${recipient}: ${JSON.stringify(error.response.data)}`,
          );
        } else if (error instanceof Error) {
          this.logger.error(`SMS error for ${recipient}: ${error.message}`);
        } else {
          this.logger.error(`SMS error for ${recipient}: unknown error`);
        }
        this.logger.warn(`SMS attempt ${attempt} failed for ${recipient}`);
        if (attempt === 3) {
          throw error;
        }
      }
    }
  }
}
