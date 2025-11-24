// src/balance/balance.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a balance-year entry for a project
   */
async createBalance(data: {
  projectId: string;
  year: number;
  fixedAssets?: number;
  investments?: number;
  inventory?: number;
  receivables?: number;
  otherShortTermAssets?: number;
  cash?: number;
  equity?: number;
  longDebt?: number;
  shortDebt?: number;
  payables?: number;
  otherShortTermLiabilities?: number;
  depreciationPct?: number;
  interestRatePct?: number;
  ratioDio?: number;
  ratioDso?: number;
  ratioDpo?: number;
  ratioOcaPct?: number;
  ratioOclPct?: number;
}) {
  return this.prisma.balanceYear.create({
    data: {
      projectId: data.projectId,
      year: data.year,

      fixedAssets: data.fixedAssets ?? 0,
      investments: data.investments ?? 0,
      inventory: data.inventory ?? 0,
      receivables: data.receivables ?? 0,
      otherShortTermAssets: data.otherShortTermAssets ?? 0,
      cash: data.cash ?? 0,
      equity: data.equity ?? 0,
      longDebt: data.longDebt ?? 0,
      shortDebt: data.shortDebt ?? 0,
      payables: data.payables ?? 0,
      otherShortTermLiabilities: data.otherShortTermLiabilities ?? 0,
      depreciationPct: data.depreciationPct ?? 10,
      interestRatePct: data.interestRatePct ?? 5,

      // ⭐ ADD KPI FIELDS BELOW
      ratioDio: data.ratioDio ?? 0,
      ratioDso: data.ratioDso ?? 0,
      ratioDpo: data.ratioDpo ?? 0,
      ratioOcaPct: data.ratioOcaPct ?? 0,
      ratioOclPct: data.ratioOclPct ?? 0,
    },
    });
  }

  /* ======================================================
     WORKING CAPITAL CALCULATIONS
     ====================================================== */

  computeWorkingCapital(input: {
    revenue: number;
    cogs: number;
    opex: number;

    ratios: {
      dio: number;
      dso: number;
      dpo: number;
      otherCurrentAssetsPct: number;
      otherCurrentLiabilitiesPct: number;
    };
  }) {
    const { revenue, cogs, opex, ratios } = input;

    const inventory = Math.round((ratios.dio / 365) * cogs);
    const receivables = Math.round((ratios.dso / 365) * revenue);
    const payables = Math.round((ratios.dpo / 365) * (cogs));

    const otherShortTermAssets = Math.round(
      (ratios.otherCurrentAssetsPct / 100) * revenue,
    );

    const otherShortTermLiabilities = Math.round(
      (ratios.otherCurrentLiabilitiesPct / 100) * revenue,
    );

    return {
      inventory,
      receivables,
      otherShortTermAssets,
      payables,
      otherShortTermLiabilities,
    };
  }

  /**
   * Get all balance entries for a project
   */
  async getByProject(projectId: string) {
    return this.prisma.balanceYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Delete all balance entries for a project
   */
  async deleteByProject(projectId: string) {
    return this.prisma.balanceYear.deleteMany({
      where: { projectId },
    });
  }

  /* ======================================================
     ⭐ NEW — UPDATE A SINGLE FIELD
     ====================================================== */

  async updateSingle(body: {
    projectId: string;
    year: number;
    field: string;
    value: number;
  }) {
    return this.prisma.balanceYear.updateMany({
      where: {
        projectId: body.projectId,
        year: body.year,
      },
      data: {
        [body.field]: body.value,
      },
    });
  }

  async updateRatio(data: {
  projectId: string;
  year: number;
  field: string;
  value: number;
}) {
  const allowedFields = [
    "ratioDio",
    "ratioDso",
    "ratioDpo",
    "ratioOcaPct",
    "ratioOclPct",
  ];

  if (!allowedFields.includes(data.field)) {
    throw new Error(`Invalid ratio field: ${data.field}`);
  }

  return this.prisma.balanceYear.updateMany({
    where: {
      projectId: data.projectId,
      year: data.year,
    },
    data: {
      [data.field]: data.value,
    },
  });
}
}
