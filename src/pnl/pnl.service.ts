// src/pnl/pnl.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const round1 = (v?: number | null) =>
  v === null || v === undefined ? v : Math.round(v * 10) / 10;

const clampPct = (v?: number | null) =>
  v === null || v === undefined ? v : Math.min(100, Math.max(0, v));

@Injectable()
export class PnlService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ensure project belongs to user (or 404).
   */
  private async assertProjectOwned(userId: number, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: String(projectId), userId: Number(userId) },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found.',
      });
    }
  }

  /* ------------------------------------------------------------------
     CREATE a record for a specific year
  ------------------------------------------------------------------ */
  async addYear(
    userId: number,
    data: {
      projectId: string;
      year: number;
      revenue: number;
      cogs: number;
      opex: number;
      depreciation: number;
      interest: number;
      taxes: number;
      revenueGrowthPct?: number;
      cogsPct?: number | null;
      opexPct?: number | null;
      taxRatePct?: number;
    },
  ) {
    await this.assertProjectOwned(userId, data.projectId);

    return this.prisma.pnlYear.create({
      data: {
        projectId: String(data.projectId),
        year: data.year,

        // RAW amounts (no rounding)
        revenue: data.revenue,
        cogs: data.cogs,
        opex: data.opex,
        depreciation: data.depreciation,
        interest: data.interest,
        taxes: data.taxes,

        // KPI drivers (enforce: 1 decimal, clamp 0-100 for % fields)
        revenueGrowthPct: round1(data.revenueGrowthPct ?? 0) ?? 0,
        cogsPct:
          data.cogsPct === null
            ? null
            : (round1(clampPct(data.cogsPct ?? null)) as number | null),
        opexPct:
          data.opexPct === null
            ? null
            : (round1(clampPct(data.opexPct ?? null)) as number | null),
        taxRatePct: round1(clampPct(data.taxRatePct ?? 25)) ?? 25,
      },
    });
  }

  /* ------------------------------------------------------------------
     GET all years for project
  ------------------------------------------------------------------ */
  async getForProject(userId: number, projectId: string) {
    await this.assertProjectOwned(userId, projectId);

    return this.prisma.pnlYear.findMany({
      where: { projectId: String(projectId) },
      orderBy: { year: 'asc' },
    });
  }

  /* ------------------------------------------------------------------
     GET single record by numeric id (must be ownership checked)
  ------------------------------------------------------------------ */
  async getById(userId: number, id: number) {
    if (!Number.isFinite(id)) {
      throw new BadRequestException({
        code: 'INVALID_ID',
        message: 'Invalid id.',
      });
    }

    // IMPORTANT: do NOT allow enumeration across users
    const row = await this.prisma.pnlYear.findFirst({
      where: {
        id,
        project: {
          userId: Number(userId),
        },
      },
    });

    if (!row) {
      throw new NotFoundException({
        code: 'PNL_NOT_FOUND',
        message: 'P&L row not found.',
      });
    }

    return row;
  }

  /* ------------------------------------------------------------------
     DELETE all P&L for project (requires ownership)
  ------------------------------------------------------------------ */
  async deleteForProject(userId: number, projectId: string) {
    await this.assertProjectOwned(userId, projectId);

    return this.prisma.pnlYear.deleteMany({
      where: { projectId: String(projectId) },
    });
  }

  /* ------------------------------------------------------------------
     UPDATE ONLY depreciation + interest (balance → pnl sync)
     Used by: POST /pnl/update-from-balance
  ------------------------------------------------------------------ */
  async updateFromBalance(
    userId: number,
    projectId: string,
    updates: { year: number; depreciation: number; interest: number }[],
  ) {
    await this.assertProjectOwned(userId, projectId);

    const promises = updates.map((u) =>
      this.prisma.pnlYear.upsert({
        where: {
          projectId_year: {
            projectId: String(projectId),
            year: u.year,
          },
        },
        update: {
          depreciation: u.depreciation,
          interest: u.interest,
        },
        create: {
          projectId: String(projectId),
          year: u.year,

          revenue: 0,
          cogs: 0,
          opex: 0,
          taxes: 0,

          depreciation: u.depreciation,
          interest: u.interest,

          revenueGrowthPct: 0,
          cogsPct: null,
          opexPct: null,
          taxRatePct: 25,
        },
      }),
    );

    return Promise.all(promises);
  }

  /* ------------------------------------------------------------------
     GENERAL UPDATE for 1 row (PATCH /pnl/update)
  ------------------------------------------------------------------ */
  async updateSingle(
    userId: number,
    data: {
      projectId: string;
      year: number;
      depreciation?: number;
      interest?: number;
      revenueGrowthPct?: number;
      cogsPct?: number | null;
      opexPct?: number | null;
      taxRatePct?: number;
    },
  ) {
    await this.assertProjectOwned(userId, data.projectId);

    return this.prisma.pnlYear.upsert({
      where: {
        projectId_year: {
          projectId: String(data.projectId),
          year: data.year,
        },
      },
      update: {
        ...(data.depreciation !== undefined
          ? { depreciation: data.depreciation }
          : {}),
        ...(data.interest !== undefined ? { interest: data.interest } : {}),

        ...(data.revenueGrowthPct !== undefined
          ? { revenueGrowthPct: round1(data.revenueGrowthPct) ?? 0 }
          : {}),

        ...(data.cogsPct !== undefined
          ? {
              cogsPct:
                data.cogsPct === null
                  ? null
                  : (round1(clampPct(data.cogsPct)) as number),
            }
          : {}),

        ...(data.opexPct !== undefined
          ? {
              opexPct:
                data.opexPct === null
                  ? null
                  : (round1(clampPct(data.opexPct)) as number),
            }
          : {}),

        ...(data.taxRatePct !== undefined
          ? { taxRatePct: round1(clampPct(data.taxRatePct)) ?? 25 }
          : {}),
      },
      create: {
        projectId: String(data.projectId),
        year: data.year,

        revenue: 0,
        cogs: 0,
        opex: 0,
        taxes: 0,

        depreciation: data.depreciation ?? 0,
        interest: data.interest ?? 0,

        revenueGrowthPct: round1(data.revenueGrowthPct ?? 0) ?? 0,
        cogsPct:
          data.cogsPct === null
            ? null
            : (round1(clampPct(data.cogsPct ?? null)) as number | null),
        opexPct:
          data.opexPct === null
            ? null
            : (round1(clampPct(data.opexPct ?? null)) as number | null),
        taxRatePct: round1(clampPct(data.taxRatePct ?? 25)) ?? 25,
      },
    });
  }
}
