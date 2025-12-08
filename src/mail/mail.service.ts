// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'Your App <noreply@yourapp.com>',
        to: email,
        subject: 'Verify your email',
        html: `
          <h1>Verify your email</h1>
          <p>Click the link below to activate your account:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you didn’t create this account, ignore this message.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }
}
