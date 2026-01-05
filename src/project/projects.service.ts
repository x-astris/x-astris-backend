// src/project/projects.service.ts

import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_LIMITS, isPremium } from '../common/entitlements';


@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all projects belonging to the user
   */
  async getProjectsByUser(userId: string | number) {
    return this.prisma.project.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific project by ID, ONLY if it belongs to the user
   */
  async getProjectById(id: string, userId: string | number) {
    return this.prisma.project.findFirst({
      where: {
        id: String(id),
        userId: Number(userId),
      },
    });
  }

  /**
   * Create a new project
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

  return this.prisma.project.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      startYear: input.startYear,
      forecastYears: input.forecastYears ?? 5,
    },
  });
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
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }

    // FREE limit: forecastYears <= 5
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
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.forecastYears !== undefined ? { forecastYears: patch.forecastYears } : {}),
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
