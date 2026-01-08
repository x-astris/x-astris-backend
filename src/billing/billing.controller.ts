// src/billing/billing.controller.ts

import {
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Req() req: Request) {
    const user = (req as any).user;
    const userId = Number(user?.id ?? user?.sub);
    const email = user?.email;

    if (!userId || !email) {
      throw new BadRequestException('Invalid user token');
    }

    return this.billing.createCheckoutSession(String(userId), email);
  }

  @Post('portal')
  async createPortalSession(@Req() req: Request) {
    const user = (req as any).user;
    const userId = Number(user?.id ?? user?.sub);

    if (!userId) {
      throw new BadRequestException('Invalid user token');
    }

    return this.billing.createPortalSession(String(userId));
  }
}
