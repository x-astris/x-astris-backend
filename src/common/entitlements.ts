import { Plan } from '@prisma/client';

export const FREE_LIMITS = {
  maxProjects: 1,
  maxForecastYears: 5,
} as const;

export function isPremium(user: { plan: Plan }) {
  return user.plan === Plan.PREMIUM;
}
