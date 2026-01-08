// src/cashflow/cashflow.service.ts

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure project belongs to user
   */
  private async assertProjectOwned(userId: number, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: String(projectId),
        userId: Number(userId),
      },
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
   * Get PNL rows for a project (ownership enforced)
   */
  private async getPnl(projectId: string) {
    return this.prisma.pnlYear.findMany({
      where: { projectId: String(projectId) },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Get Balance rows for a project (ownership enforced)
   */
  private async getBalance(projectId: string) {
    return this.prisma.balanceYear.findMany({
      where: { projectId: String(projectId) },
      orderBy: { year: 'asc' },
    });
  }

  /**
   * Combine data so front-end can calculate Cashflow
   */
  async getFullCashflow(userId: number, projectId: string) {
    await this.assertProjectOwned(userId, projectId);

    const [pnl, balance] = await Promise.all([
      this.getPnl(projectId),
      this.getBalance(projectId),
    ]);

    return {
      pnl,
      balance,
    };
  }
}
