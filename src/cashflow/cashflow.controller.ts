// src/cashflow/cashflow.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { CashflowService } from './cashflow.service';

@Controller('cashflows')
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  /**
   * GET /cashflows?projectId=uuid
   * Returns both PNL & Balance for this project
   */
  @Get()
  async getCashflow(@Query('projectId') projectId: string) {
    return this.cashflowService.getFullCashflow(projectId);
  }
}
