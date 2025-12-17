// src/pnl/pnl.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

        revenue: data.revenue,
        cogs: data.cogs,
        opex: data.opex,
        depreciation: data.depreciation,
        interest: data.interest,
        taxes: data.taxes,

        revenueGrowthPct: data.revenueGrowthPct ?? 0,
        cogsPct: data.cogsPct ?? null,
        opexPct: data.opexPct ?? null,
        taxRatePct: data.taxRatePct ?? 25,
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

        // defaults for optional fields
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
      depreciation: data.depreciation,
      interest: data.interest,
      revenueGrowthPct: data.revenueGrowthPct,
      cogsPct: data.cogsPct,
      opexPct: data.opexPct,
      taxRatePct: data.taxRatePct,
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

      revenueGrowthPct: data.revenueGrowthPct ?? 0,
      cogsPct: data.cogsPct ?? null,
      opexPct: data.opexPct ?? null,
      taxRatePct: data.taxRatePct ?? 25,
    },
  });
}
}
