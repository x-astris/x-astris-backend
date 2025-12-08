// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,      // ⬅ Strategy must be a provider
    JwtAuthGuard,
    MailService,    // ⬅ Guard must be a provider
  ],

  exports: [
    JwtModule,
    PassportModule,
    JwtStrategy,      // ⬅ Export so other modules can use it
    JwtAuthGuard,     // ⬅ Export so other modules can use it
  ],
})
export class AuthModule {}
