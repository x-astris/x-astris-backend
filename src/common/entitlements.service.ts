import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

export const FREE_LIMITS = {
  maxProjects: 1,
  maxForecastYears: 5,
} as const;

@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  async getUserEntitlements(userId: number) {
    const uid = Number(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        email: true,
        plan: true,
        subscription: {
          select: { status: true, currentPeriodEnd: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Stripe-ready: later kun je premium bepalen op subscription.status + periodEnd
    const isPremium = user.plan === Plan.PREMIUM;

    const projectCount = await this.prisma.project.count({ where: { userId: uid } });

    const limits = isPremium
      ? { maxProjects: null, maxForecastYears: null } // null = unlimited (voor nu)
      : { maxProjects: FREE_LIMITS.maxProjects, maxForecastYears: FREE_LIMITS.maxForecastYears };

    const canCreateProject = isPremium ? true : projectCount < FREE_LIMITS.maxProjects;

    return {
      user: { id: user.id, email: user.email, plan: user.plan },
      subscription: user.subscription,
      projectCount,
      limits,
      canCreateProject,
      isPremium,
    };
  }
}
