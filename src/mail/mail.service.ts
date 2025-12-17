import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

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
          <p>Click the link below to activate your X-ASTRiS account:</p>
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
  // SEND WELCOME EMAIL
  // ------------------------------------------------------------
  async sendWelcomeEmail(email: string) {
    try {
      await this.resend.emails.send({
        from: process.env.MAIL_FROM || 'Your App <noreply@yourapp.com>',
        to: email,
        subject: 'Welcome to X-ASTRiS 🚀',
        html: `
          <h1>Welcome to X-ASTRiS 🚀</h1>
          <p>Your email has been successfully verified.</p>

          <p>You can now log in and start creating your own financial forecast models!</p>

          <p>
            <a href="${process.env.APP_URL}/login">
              Log in to your account
            </a>
          </p>

          <p>If you have questions, please contact us via support@x-astris.com.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send welcome email', error);
      // DO NOT throw — verification must succeed
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
          <p>If you didn't request this reset, just ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw error;
    }
  }
}
