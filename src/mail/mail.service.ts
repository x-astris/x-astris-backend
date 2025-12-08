import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // ------------------------------------------------------------
  // SEND VERIFICATION EMAIL
  // ------------------------------------------------------------
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
          <p>If you didn’t create this account, you can ignore this message.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }

  // ------------------------------------------------------------
  // SEND PASSWORD RESET EMAIL
  // ------------------------------------------------------------
  async sendPasswordResetMail(email: string, resetUrl: string) {
    try {
      await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'Your App <noreply@yourapp.com>',
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this reset, just ignore this email. Your password will remain unchanged.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw error;
    }
  }
}
