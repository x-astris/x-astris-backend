// src/webhooks/stripe-webhook.controller.ts

import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'TRIALING';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    default:
      return 'CANCELED';
  }
}

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // apiVersion: '2024-06-20',
    });
  }

  @Post()
  async handle(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature?: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
    if (!signature) return res.status(400).send('Missing Stripe-Signature header');

    let event: Stripe.Event;
    try {
      // IMPORTANT: req.body must be a Buffer via express.raw({type:'application/json'})
      event = this.stripe.webhooks.constructEvent(
        req.body as any,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err?.message ?? 'Invalid signature'}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          const userIdRaw = session.metadata?.userId ?? session.client_reference_id;
          const userId = userIdRaw ? Number(userIdRaw) : null;

          const customerId =
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id ?? null;

          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id ?? null;

          if (!userId || !customerId) break;

          await this.prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              provider: 'stripe',
              providerCustomerId: customerId,
              providerSubId: subId ?? undefined,
            },
            update: {
              provider: 'stripe',
              providerCustomerId: customerId,
              providerSubId: subId ?? undefined,
            },
          });

          if (subId) {
            const sub = await this.stripe.subscriptions.retrieve(subId);
            const mappedStatus = mapStripeStatus(sub.status);

            const periodEndSeconds = (sub as any).current_period_end as number | undefined;
            const currentPeriodEnd = periodEndSeconds
              ? new Date(periodEndSeconds * 1000)
              : null;

            await this.prisma.subscription.update({
              where: { userId },
              data: {
                providerSubId: sub.id,
                status: mappedStatus as any,
                currentPeriodEnd: currentPeriodEnd ?? undefined,
              },
            });

            const premiumNow = mappedStatus === 'ACTIVE' || mappedStatus === 'TRIALING';

            await this.prisma.user.update({
              where: { id: userId },
              data: { plan: premiumNow ? 'PREMIUM' : 'FREE' },
            });
          }

          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;

          const customerId =
            typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

          const subId = sub.id;

          const userIdFromMeta = sub.metadata?.userId ? Number(sub.metadata.userId) : null;
          let userId: number | null = userIdFromMeta;

          if (!userId) {
            const existing = await this.prisma.subscription.findFirst({
              where: { provider: 'stripe', providerCustomerId: customerId },
              select: { userId: true },
            });
            userId = existing?.userId ?? null;
          }

          if (!userId) break;

          const mappedStatus = mapStripeStatus(sub.status);

          const periodEndSeconds = (sub as any).current_period_end as number | undefined;
          const currentPeriodEnd = periodEndSeconds
            ? new Date(periodEndSeconds * 1000)
            : null;

          await this.prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              provider: 'stripe',
              providerCustomerId: customerId,
              providerSubId: subId,
              status: mappedStatus as any,
              currentPeriodEnd: currentPeriodEnd ?? undefined,
            },
            update: {
              provider: 'stripe',
              providerCustomerId: customerId,
              providerSubId: subId,
              status: mappedStatus as any,
              currentPeriodEnd: currentPeriodEnd ?? undefined,
            },
          });

          const premiumNow = mappedStatus === 'ACTIVE' || mappedStatus === 'TRIALING';

          await this.prisma.user.update({
            where: { id: userId },
            data: { plan: premiumNow ? 'PREMIUM' : 'FREE' },
          });

          break;
        }

        default:
          break;
      }
    } catch {
      // Always return 2xx to prevent Stripe retries on your internal errors
      // (log internally in your global logger/middleware if needed)
      return res.json({ received: true });
    }

    return res.json({ received: true });
  }
}
