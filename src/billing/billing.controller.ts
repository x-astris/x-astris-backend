import { Controller, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Req() req: Request) {
    const userId = Number((req as any).user?.id || (req as any).user?.sub);
    const email = (req as any).user?.email;

    if (!userId) {
      throw new BadRequestException('Missing user id in token');
    }

    return this.billing.createCheckoutSession(String(userId), email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async createPortalSession(@Req() req: Request) {
    const userId = Number((req as any).user?.id || (req as any).user?.sub);

    if (!userId) {
      throw new BadRequestException('Missing user id in token');
    }

    return this.billing.createPortalSession(String(userId));
  }
}