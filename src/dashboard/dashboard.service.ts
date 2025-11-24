// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all PNL rows for a project
   */
  async getPnl(projectId: string) {
    return this.prisma.pnlYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Get all Balance rows for a project
   */
  async getBalance(projectId: string) {
    return this.prisma.balanceYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Aggregate dashboard data for the front-end
   * 
   * No business logic imposed — front-end can compute:
   * EBITDA, Net Profit, Cashflow, ROE, ROA, Debt ratios, etc.
   */
  async getDashboard(projectId: string) {
    const pnl = await this.getPnl(projectId);
    const balance = await this.getBalance(projectId);

    return {
      projectId,
      pnl,
      balance,
      years:
        pnl.length > 0
          ? pnl.map((x) => x.year)
          : balance.map((x) => x.year),
    };
  }
}
