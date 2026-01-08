// src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  // ------------------------------------------------------------
  // REGISTER USER + SEND VERIFICATION EMAIL
  // ------------------------------------------------------------
  async register(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashed,
          verified: false,
        },
      });

      const token = crypto.randomBytes(32).toString('hex');

      await this.prisma.emailVerificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await this.mail.sendVerificationEmail(user.email, token);

      return { message: 'Registration successful. Please verify your email.' };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email address already exists.');
      }
      throw new InternalServerErrorException('Registration failed.');
    }
  }

  // ------------------------------------------------------------
  // VERIFY EMAIL TOKEN
  // ------------------------------------------------------------
  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required.');
    }

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.emailVerificationToken.delete({ where: { token } });
      }
      throw new BadRequestException('Invalid or expired token.');
    }

    if (record.user.verified) {
      await this.prisma.emailVerificationToken.delete({ where: { token } });
      return { message: 'Email already verified.' };
    }

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { verified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { token },
    });

    // fire-and-forget
    void this.mail.sendWelcomeEmail(record.user.email);

    return { message: 'Email verified successfully.' };
  }

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.verified) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const token = this.jwt.sign({
      id: user.id,
      email: user.email,
    });

    return { token };
  }

  // ------------------------------------------------------------
  // REQUEST PASSWORD RESET
  // ------------------------------------------------------------
  async requestPasswordReset(email: string) {
    if (!email) {
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    // Optional cleanup: remove old tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await this.mail.sendPasswordResetMail(user.email, resetUrl);

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  // ------------------------------------------------------------
  // RESET PASSWORD
  // ------------------------------------------------------------
  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and password are required.');
    }

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.passwordResetToken.delete({ where: { token } });
      }
      throw new BadRequestException('Invalid or expired token.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    });

    await this.prisma.passwordResetToken.delete({
      where: { token },
    });

    return { message: 'Password has been reset successfully.' };
  }
}
