// src/cashflow/cashflow.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CashflowService } from './cashflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cashflows')
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  /**
   * GET /cashflows?projectId=uuid
   * Returns computed cashflow data for this project
   */
  @Get()
  async getCashflow(
    @Request() req,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const userId = Number(req.user?.id ?? req.user?.sub);
    if (!userId) {
      throw new BadRequestException('Invalid user token');
    }

    return this.cashflowService.getFullCashflow(userId, projectId);
  }
}
