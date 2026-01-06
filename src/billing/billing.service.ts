import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],

    // ✅ Stripe Tax (EU B2C + B2B correct)
    automatic_tax: { enabled: true },

    // ✅ Adres verplicht (zorgt dat VAT altijd correct berekend wordt, ook mobiel)
    billing_address_collection: 'required',

    // 🔥 B2B: VAT-nummer laten invoeren + valideren
    tax_id_collection: { enabled: true },

    success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/billing/cancel`,

    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = customerId
    ? {
        ...baseParams,
        customer: customerId,
        // ✅ alleen toegestaan als je `customer` meestuurt
        customer_update: { name: 'auto' },
      }
    : {
        ...baseParams,
        ...(email ? { customer_email: email } : {}),
        // ❌ geen customer_update hier
      };

  const session = await this.stripe.checkout.sessions.create(sessionParams);

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
