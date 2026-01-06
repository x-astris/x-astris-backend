import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "CANCELED";
  }
}

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature?: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
    }

    if (!signature) {
      return res.status(400).send('Missing Stripe-Signature header');
    }

    let event: Stripe.Event;

    try {
      // req.body is Buffer door express.raw()
      event = this.stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log("✅ WEBHOOK VERIFIED:", event.type, "id:", event.id);

    // business logic

        switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        const subId = sub.id;

        // Later zetten we metadata.userId vanuit checkout/portal flow.
        const userIdFromMeta = sub.metadata?.userId
          ? Number(sub.metadata.userId)
          : null;

        let userId: number | null = userIdFromMeta;

        // Fallback: probeer via bestaande subscription record op customerId
        if (!userId) {
          const existing = await this.prisma.subscription.findFirst({
            where: { provider: "stripe", providerCustomerId: customerId },
            select: { userId: true },
          });
          userId = existing?.userId ?? null;
        }

        if (!userId) {
          console.warn("Stripe webhook: could not map customer to user", {
            eventId: event.id,
            customerId,
            subId,
            type: event.type,
          });
          break; // accepteer event, anders gaat Stripe retryen
        }

        const mappedStatus = mapStripeStatus(sub.status);

        const currentPeriodEndSeconds = (sub as any).current_period_end as number | undefined;

        const currentPeriodEnd = currentPeriodEndSeconds
        ? new Date(currentPeriodEndSeconds * 1000)
        : null;

        console.log("🧾 checkout.session.completed mapping", { userId, customerId, subId });
        
        // userId is @unique in jouw Subscription model → upsert op userId
        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            provider: "stripe",
            providerCustomerId: customerId,
            providerSubId: subId,
            status: mappedStatus as any,
            currentPeriodEnd: currentPeriodEnd ?? undefined,
          },
          update: {
            provider: "stripe",
            providerCustomerId: customerId,
            providerSubId: subId,
            status: mappedStatus as any,
            currentPeriodEnd: currentPeriodEnd ?? undefined,
          },
        });

        const premiumNow =
          mappedStatus === "ACTIVE" || mappedStatus === "TRIALING";

        await this.prisma.user.update({
          where: { id: userId },
          data: { plan: premiumNow ? "PREMIUM" : "FREE" },
        });

        break;
      }

case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;

  const userIdRaw = session.metadata?.userId ?? session.client_reference_id;
  const userId = userIdRaw ? Number(userIdRaw) : null;

  const customerId = session.customer as string | null;
  const subId = session.subscription as string | null;

  if (!userId || !customerId) {
    console.warn("checkout.session.completed: missing userId or customerId", {
      eventId: event.id,
      userId,
      customerId,
      subId,
    });
    break;
  }

  console.log("🧾 checkout.session.completed mapping", { userId, customerId, subId });

  // 1) Maak/Update Subscription row zodat mapping voor toekomstige events werkt
  await this.prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      provider: "stripe",
      providerCustomerId: customerId,
      providerSubId: subId ?? undefined,
    },
    update: {
      providerCustomerId: customerId,
      providerSubId: subId ?? undefined,
    },
  });

  // 2) Als we een subscription id hebben: haal hem op en sync status + period end + plan meteen
  if (subId) {
    const sub = await this.stripe.subscriptions.retrieve(subId);

    const mappedStatus = mapStripeStatus(sub.status);

    const currentPeriodEndSeconds = (sub as any).current_period_end as number | undefined;
    const currentPeriodEnd = currentPeriodEndSeconds
      ? new Date(currentPeriodEndSeconds * 1000)
      : null;

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        providerSubId: sub.id,
        status: mappedStatus as any,
        currentPeriodEnd: currentPeriodEnd ?? undefined,
      },
    });

    const premiumNow = mappedStatus === "ACTIVE" || mappedStatus === "TRIALING";

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: premiumNow ? "PREMIUM" : "FREE" },
    });
  }

  break;
}

      default:
        // ignore other events for now
        break;
    }


    

    return res.json({ received: true });
  }
}
