// src/balance/balance.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBalanceDto } from './dto/create-balance.dto';

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ensure project belongs to user (or 404).
   * This prevents cross-user access by guessing projectId.
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

  /**
   * Create a balance-year entry for a project (requires ownership)
   */
  async createBalance(
    userId: number,
    data: CreateBalanceDto)
   {
    await this.assertProjectOwned(userId, data.projectId);

    return this.prisma.balanceYear.create({
      data: {
        projectId: String(data.projectId),
        year: data.year,
        fixedAssets: data.fixedAssets ?? 0,
        investments: data.investments ?? 0,
        inventory: data.inventory ?? 0,
        receivables: data.receivables ?? 0,
        otherShortTermAssets: data.otherShortTermAssets ?? 0,
        cash: data.cash ?? 0,
        equity: data.equity ?? 0,
        equityContribution: data.equityContribution ?? 0,
        dividend: data.dividend ?? 0,
        longDebt: data.longDebt ?? 0,
        shortDebt: data.shortDebt ?? 0,
        payables: data.payables ?? 0,
        otherShortTermLiabilities: data.otherShortTermLiabilities ?? 0,
        depreciationPct: data.depreciationPct ?? 10,
        interestRatePct: data.interestRatePct ?? 5,
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
    const { revenue, cogs, ratios } = input;

    const inventory = Math.round((ratios.dio / 365) * cogs);
    const receivables = Math.round((ratios.dso / 365) * revenue);
    const payables = Math.round((ratios.dpo / 365) * cogs);

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
   * Get all balance entries for a project (requires ownership)
   */
  async getByProject(userId: number, projectId: string) {
    await this.assertProjectOwned(userId, projectId);

    return this.prisma.balanceYear.findMany({
      where: { projectId: String(projectId) },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Delete all balance entries for a project (requires ownership)
   */
  async deleteByProject(userId: number, projectId: string) {
    await this.assertProjectOwned(userId, projectId);

    return this.prisma.balanceYear.deleteMany({
      where: { projectId: String(projectId) },
    });
  }

  /* ======================================================
     UPDATE FIELDS
     ====================================================== */

  async updateSingle(
    userId: number,
    body: { projectId: string; year: number; field: string; value: number },
  ) {
    const allowedFields = [
      'equityContribution',
      'dividend',
      'longDebt',
      'shortDebt',
      'interestRatePct',
      'fixedAssets',
      'investments',
      'cash',
    ];

    if (!allowedFields.includes(body.field)) {
      throw new BadRequestException({
        code: 'INVALID_FIELD',
        message: `Invalid update field: ${body.field}`,
      });
    }

    await this.assertProjectOwned(userId, body.projectId);

    return this.prisma.balanceYear.updateMany({
      where: {
        projectId: String(body.projectId),
        year: body.year,
      },
      data: {
        [body.field]: body.value,
      },
    });
  }

  async updateRatio(
    userId: number,
    data: { projectId: string; year: number; field: string; value: number },
  ) {
    const allowedFields = [
      'ratioDio',
      'ratioDso',
      'ratioDpo',
      'ratioOcaPct',
      'ratioOclPct',
    ];

    if (!allowedFields.includes(data.field)) {
      throw new BadRequestException({
        code: 'INVALID_FIELD',
        message: `Invalid ratio field: ${data.field}`,
      });
    }

    await this.assertProjectOwned(userId, data.projectId);

    return this.prisma.balanceYear.updateMany({
      where: {
        projectId: String(data.projectId),
        year: data.year,
      },
      data: {
        [data.field]: data.value,
      },
    });
  }
}
