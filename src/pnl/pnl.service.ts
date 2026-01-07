// src/pnl/pnl.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const round1 = (v?: number | null) =>
  v === null || v === undefined ? v : Math.round(v * 10) / 10;

const clampPct = (v?: number | null) =>
  v === null || v === undefined ? v : Math.min(100, Math.max(0, v));

@Injectable()
export class PnlService {
  constructor(private prisma: PrismaService) {}

  /* ------------------------------------------------------------------
     CREATE a record for a specific year
  ------------------------------------------------------------------ */
  async addYear(data: {
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
  }) {
    return this.prisma.pnlYear.create({
      data: {
        projectId: data.projectId,
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
  async getForProject(projectId: string) {
    return this.prisma.pnlYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /* ------------------------------------------------------------------
     GET single record by numeric id
  ------------------------------------------------------------------ */
  async getById(id: number) {
    return this.prisma.pnlYear.findUnique({
      where: { id },
    });
  }

  /* ------------------------------------------------------------------
     DELETE all P&L for project
  ------------------------------------------------------------------ */
  async deleteForProject(projectId: string) {
    return this.prisma.pnlYear.deleteMany({
      where: { projectId },
    });
  }

  /* ------------------------------------------------------------------
     UPDATE ONLY depreciation + interest (balance → pnl sync)
     Used by: POST /pnl/update-from-balance
  ------------------------------------------------------------------ */
  async updateFromBalance(
    projectId: string,
    updates: { year: number; depreciation: number; interest: number }[],
  ) {
    const promises = updates.map((u) =>
      this.prisma.pnlYear.upsert({
        where: {
          projectId_year: {
            projectId,
            year: u.year,
          },
        },
        update: {
          // RAW amounts (no rounding)
          depreciation: u.depreciation,
          interest: u.interest,
        },
        create: {
          projectId,
          year: u.year,

          // required numeric fields — safe defaults
          revenue: 0,
          cogs: 0,
          opex: 0,
          taxes: 0,

          // synced from balance
          depreciation: u.depreciation,
          interest: u.interest,

          // defaults for optional fields (KPI drivers)
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
     Allows updating growth %, cogs %, opex %, tax rate %, etc.
     - RAW amounts remain raw
     - KPI drivers enforced to 1 decimal, % clamped 0-100
  ------------------------------------------------------------------ */
  async updateSingle(data: {
    projectId: string;
    year: number;
    depreciation?: number;
    interest?: number;
    revenueGrowthPct?: number;
    cogsPct?: number | null;
    opexPct?: number | null;
    taxRatePct?: number;
  }) {
    return this.prisma.pnlYear.upsert({
      where: {
        projectId_year: {
          projectId: data.projectId,
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
        projectId: data.projectId,
        year: data.year,

        // required base fields
        revenue: 0,
        cogs: 0,
        opex: 0,
        taxes: 0,

        // optional / synced
        depreciation: data.depreciation ?? 0,
        interest: data.interest ?? 0,

        // KPI drivers (enforced)
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
