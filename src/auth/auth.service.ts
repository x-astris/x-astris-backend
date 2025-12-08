import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service'; // ⬅️ YOU MUST HAVE THIS

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,      // ⬅️ inject MailService from previous step
  ) {}

  // ---------------------------------------------
  // REGISTER (now creates user + verification token)
  // ---------------------------------------------
  async register(email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);

    try {
      // 1. Create user with verified = false
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashed,
          verified: false,
        },
      });

      // 2. Create email verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await this.prisma.emailVerificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // 3. Send verification email
      await this.mail.sendVerificationEmail(email, token);

      return {
        message: 'Registration successful. Check your email to verify your account.',
      };

    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Email address already exists');
        }
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  // ---------------------------------------------
  // VERIFY EMAIL (called by controller)
  // ---------------------------------------------
  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({ where: { token } });
      throw new BadRequestException('Token expired');
    }

    // Mark user as verified
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { verified: true },
    });

    // Delete used token
    await this.prisma.emailVerificationToken.delete({
      where: { token },
    });

    return { message: 'Email verified successfully' };
  }

  // ---------------------------------------------
  // LOGIN (now blocks unverified accounts)
  // ---------------------------------------------
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // ⬅️ Prevent login until email is verified
    if (!user.verified) {
      throw new UnauthorizedException('Please verify your email first.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({
      id: user.id,
      email: user.email,
    });

    return { token };
  }
}
