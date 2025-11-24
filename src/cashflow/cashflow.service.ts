// src/cashflow/cashflow.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashflowService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get PNL rows for a project
   */
  async getPnl(projectId: string) {
    return this.prisma.pnlYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Get Balance rows for a project
   */
  async getBalance(projectId: string) {
    return this.prisma.balanceYear.findMany({
      where: { projectId },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Combine data so front-end can calculate Cashflow
   */
  async getFullCashflow(projectId: string) {
    const pnl = await this.getPnl(projectId);
    const balance = await this.getBalance(projectId);

    return {
      pnl,
      balance,
    };
  }
}
