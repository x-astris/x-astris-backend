// src/mail/mail.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly appUrl: string;
  private readonly mailFrom: string;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    this.mailFrom =
      process.env.MAIL_FROM ?? 'X-ASTRiS <noreply@x-astris.com>';
  }

  // ------------------------------------------------------------
  // SEND VERIFICATION EMAIL
  // ------------------------------------------------------------
  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.mailFrom,
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
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  // ------------------------------------------------------------
  // SEND WELCOME EMAIL (NON-BLOCKING)
  // ------------------------------------------------------------
  async sendWelcomeEmail(email: string) {
    try {
      await this.resend.emails.send({
        from: this.mailFrom,
        to: email,
        subject: 'Welcome to X-ASTRiS 🚀',
        html: `
          <h1>Welcome to X-ASTRiS 🚀</h1>
          <p>Your email has been successfully verified.</p>

          <p>You can now log in and start creating your own financial forecast models.</p>

          <p>
            <a href="${this.appUrl}/login">Log in to your account</a>
          </p>

          <p>If you have questions, contact us at support@x-astris.com.</p>
        `,
      });
    } catch (error) {
      // Do NOT throw — verification flow must not fail
      this.logger.error('Failed to send welcome email', error);
    }
  }

  // ------------------------------------------------------------
  // SEND PASSWORD RESET EMAIL
  // ------------------------------------------------------------
  async sendPasswordResetMail(email: string, resetUrl: string) {
    try {
      await this.resend.emails.send({
        from: this.mailFrom,
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this reset, you can safely ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }
}
