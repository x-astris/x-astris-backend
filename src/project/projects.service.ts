// src/project/projects.service.ts

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_LIMITS, isPremium } from '../common/entitlements';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all projects belonging to the user
   */
  async getProjectsByUser(userId: number) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific project by ID, ONLY if it belongs to the user
   */
  async getProjectById(id: string, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: String(id),
        userId: Number(userId),
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found.',
      });
    }

    return project;
  }

  /**
   * Create a new project (+ seed base P&L row for startYear)
   */
  async createProject(input: {
    userId: number;
    name: string;
    description?: string;
    startYear: number;
    forecastYears: number;
  }) {
    const userId = Number(input.userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });
    if (!user) {
      throw new ForbiddenException({ code: 'UNAUTHENTICATED' });
    }

    // FREE limits
    if (!isPremium(user)) {
      const count = await this.prisma.project.count({
        where: { userId },
      });

      if (count >= FREE_LIMITS.maxProjects) {
        throw new ForbiddenException({
          code: 'LIMIT_PROJECTS',
          message: `Free users can create up to ${FREE_LIMITS.maxProjects} project.`,
        });
      }

      if (input.forecastYears > FREE_LIMITS.maxForecastYears) {
        throw new BadRequestException({
          code: 'LIMIT_FORECAST_YEARS',
          message: `Free users can set forecastYears up to ${FREE_LIMITS.maxForecastYears}.`,
        });
      }
    }

    // ✅ Transaction: project + seed rows are created atomically
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          userId,
          name: input.name,
          description: input.description,
          startYear: input.startYear,
          forecastYears: input.forecastYears ?? 5,
        },
      });

      // ✅ Seed base P&L row so UI doesn't return [] on first load
      await tx.pnlYear.upsert({
        where: {
          projectId_year: {
            projectId: created.id,
            year: created.startYear,
          },
        },
        update: {},
        create: {
          projectId: created.id,
          year: created.startYear,

          // required numeric fields — safe defaults
          revenue: 0,
          cogs: 0,
          opex: 0,
          taxes: 0,

          // synced/optional amounts
          depreciation: 0,
          interest: 0,

          // KPI drivers (defaults)
          revenueGrowthPct: 0,
          cogsPct: null,
          opexPct: null,
          taxRatePct: 25,
        },
      });

      return created;
    });

    return project;
  }

  /**
   * Update a project if it belongs to the user
   * Enforce FREE limits on forecastYears
   */
  async updateProject(
    projectId: string,
    userId: number,
    patch: { name?: string; description?: string; forecastYears?: number },
  ) {
    const uid = Number(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, plan: true },
    });
    if (!user) {
      throw new ForbiddenException({ code: 'UNAUTHENTICATED' });
    }

    const project = await this.prisma.project.findUnique({
      where: { id: String(projectId) },
      select: { id: true, userId: true },
    });

    if (!project || project.userId !== uid) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found.',
      });
    }

    // FREE limit: forecastYears <= max
    if (!isPremium(user) && patch.forecastYears !== undefined) {
      if (patch.forecastYears > FREE_LIMITS.maxForecastYears) {
        throw new BadRequestException({
          code: 'LIMIT_FORECAST_YEARS',
          message: `Free users can set forecastYears up to ${FREE_LIMITS.maxForecastYears}.`,
        });
      }
    }

    return this.prisma.project.update({
      where: { id: String(projectId) },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.forecastYears !== undefined
          ? { forecastYears: patch.forecastYears }
          : {}),
      },
    });
  }

  /**
   * Delete a project if it belongs to the user
   */
  async deleteProject(id: string, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: String(id),
        userId: Number(userId),
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found or access denied.',
      });
    }

    await this.prisma.project.delete({
      where: { id: String(id) },
    });

    return { success: true };
  }
}
