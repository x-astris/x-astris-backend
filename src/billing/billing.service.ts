// src/billing/billing.service.ts

import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // apiVersion: '2024-06-20',
    });
  }

  async createCheckoutSession(userId: string, email?: string) {
    const priceId =
      process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      throw new InternalServerErrorException(
        'Stripe price ID is not configured',
      );
    }

    const existingSub = await this.prisma.subscription.findUnique({
      where: { userId: Number(userId) },
      select: { providerCustomerId: true, provider: true },
    });

    const customerId =
      existingSub?.provider === 'stripe'
        ? existingSub.providerCustomerId
        : null;

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],

      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },

      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,

      client_reference_id: userId,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = customerId
      ? {
          ...baseParams,
          customer: customerId,
          customer_update: { name: 'auto' },
        }
      : {
          ...baseParams,
          ...(email ? { customer_email: email } : {}),
        };

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new InternalServerErrorException(
        'Failed to create Stripe checkout session',
      );
    }

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const uid = Number(userId);

    const sub = await this.prisma.subscription.findUnique({
      where: { userId: uid },
      select: { providerCustomerId: true, provider: true },
    });

    if (!sub || sub.provider !== 'stripe' || !sub.providerCustomerId) {
      return {
        url: null,
        code: 'NO_STRIPE_CUSTOMER',
        message:
          'No billing profile found. Upgrade first to manage billing.',
      };
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.providerCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return { url: session.url };
  }
}
