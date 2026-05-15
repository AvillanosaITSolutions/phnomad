import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const gmailUser = this.configService.get<string>('gmailUser')?.trim();
    const gmailAppPassword = this.configService
      .get<string>('gmailAppPassword')
      ?.trim();
    const smtpFrom = this.configService.get<string>('smtpFrom') as string;

    this.fromAddress = gmailUser || smtpFrom;

    const transportOptions: SMTPTransport.Options =
      gmailUser && gmailAppPassword
        ? {
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailAppPassword,
            },
          }
        : {
            host: this.configService.get<string>('smtpHost'),
            port: this.configService.get<number>('smtpPort'),
            secure: this.configService.get<boolean>('smtpSecure'),
            auth: {
              user: this.configService.get<string>('smtpUser'),
              pass: this.configService.get<string>('smtpPass'),
            },
          };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendVisaReminderEmail(params: {
    to: string;
    daysLeft: number;
    expiryDate: Date;
    country: string;
    visaType: string;
  }): Promise<void> {
    const subject = `Your visa expires in ${params.daysLeft} day${
      params.daysLeft === 1 ? '' : 's'
    }`;

    const text = `Visa reminder: Your ${params.country} ${params.visaType} visa expires on ${params.expiryDate.toDateString()} (${params.daysLeft} days left). Please prepare your extension in advance.`;

    const html = `<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#0f172a\"><h2 style=\"margin-bottom:8px\">Visa Expiry Reminder</h2><p>Your <strong>${params.country}</strong> <strong>${params.visaType}</strong> visa expires in <strong>${params.daysLeft} day${
      params.daysLeft === 1 ? '' : 's'
    }</strong>.</p><p>Expiry date: <strong>${params.expiryDate.toDateString()}</strong></p><p>Please prepare your visa extension or departure plan in advance.</p></div>`;

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: params.to,
      subject,
      text,
      html,
    });
  }
}
