import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // Aanrader: pin je API version (gebruik de versie van jouw Stripe account)
    // apiVersion: '2024-06-20',
  });

  constructor(private prisma: PrismaService) {}

  async createCheckoutSession(userId: string, email?: string) {
    const priceId =
      process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new Error('Missing STRIPE_PREMIUM_PRICE_ID (or STRIPE_PRICE_ID)');
    }

    const existingSub = await this.prisma.subscription.findUnique({
      where: { userId: Number(userId) },
      select: { providerCustomerId: true, provider: true },
    });

    const customerId =
      existingSub?.provider === 'stripe' ? existingSub.providerCustomerId : null;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],

      // ✅ Stripe Tax: zorg dat btw automatisch berekend wordt in Checkout
      automatic_tax: { enabled: true },

      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing/cancel`,

      client_reference_id: userId,

      // ✅ metadata op session (handig)
      metadata: { userId },

      // ✅ metadata op subscription (BELANGRIJK voor webhooks)
      subscription_data: {
        metadata: { userId },
      },

      // ✅ gebruik bestaande customer indien beschikbaar
      ...(customerId ? { customer: customerId } : {}),
      ...(email && !customerId ? { customer_email: email } : {}),
    });

    console.log('Created checkout session', {
      id: session.id,
      url: session.url,
      customer: session.customer,
      subscription: session.subscription,
      client_reference_id: session.client_reference_id,
      metadata: session.metadata,
    });

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
        message: 'No billing profile found. Upgrade first to manage billing.',
      };
    }

    const returnUrl = `${process.env.APP_URL}/settings/billing`;

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.providerCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }
}
