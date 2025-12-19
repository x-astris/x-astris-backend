// src/balance/balance.controller.ts

import { Controller, Post, Body, Get, Query, Delete, Patch } from '@nestjs/common';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  /**
   * POST /balance/create
   */
  @Post('create')
  async createBalance(
    @Body()
    body: {
      projectId: string;
      year: number;
      fixedAssets?: number;
      investments?: number;
      inventory?: number;
      receivables?: number;
      otherShortTermAssets?: number;
      cash?: number;
      equity?: number;
      equityContribution?: number;
      dividend?: number;
      longDebt?: number;
      shortDebt?: number;
      payables?: number;
      otherShortTermLiabilities?: number;
      depreciationPct: number;
      interestRatePct: number;
      ratioDio?: number;
      ratioDso?: number;
      ratioDpo?: number;
      ratioOcaPct?: number;
      ratioOclPct?: number;
    },
  ) {
    return this.balanceService.createBalance(body);
  }

  /**
   * GET /balance?projectId=abc-uuid
   */
  @Get()
  async getBalances(@Query('projectId') projectId: string) {
    return this.balanceService.getByProject(projectId);
  }

  /**
   * DELETE /balance?projectId=abc-uuid
   */
  @Delete()
  async deleteBalances(@Query('projectId') projectId: string) {
    return this.balanceService.deleteByProject(projectId);
  }

  @Patch("update-ratio")
async updateRatio(
  @Body()
  body: {
    projectId: string;
    year: number;
    field: string;   // e.g. "ratioDio"
    value: number;
  }
) {
  return this.balanceService.updateRatio(body);
}
}