// src/pnl/pnl.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PnlService } from './pnl.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pnl')
export class PnlController {
  constructor(private readonly pnlService: PnlService) {}

  @Post('add')
  async addPnlRecord(
    @Request() req,
    @Body()
    body: {
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
    },
  ) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.addYear(userId, body);
  }

  @Get()
  async getForProject(@Request() req, @Query('projectId') projectId: string) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.getForProject(userId, projectId);
  }

  /**
   * ⚠️ This endpoint is risky because it accepts a numeric row id.
   * Keep it only if you truly need it.
   * If kept, it MUST be ownership-checked (done in service).
   */
  @Get('single')
  async getSingle(@Request() req, @Query('id') id: string) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.getById(userId, Number(id));
  }

  @Delete()
  async deleteForProject(@Request() req, @Query('projectId') projectId: string) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.deleteForProject(userId, projectId);
  }

  @Patch('update')
  async updatePnlValue(
    @Request() req,
    @Body()
    body: {
      projectId: string;
      year: number;
      depreciation?: number;
      interest?: number;
      revenueGrowthPct?: number;
      cogsPct?: number | null;
      opexPct?: number | null;
      taxRatePct?: number;
    },
  ) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.updateSingle(userId, body);
  }

  @Post('update-from-balance')
  async updateFromBalance(
    @Request() req,
    @Body()
    body: {
      projectId: string;
      updates: { year: number; depreciation: number; interest: number }[];
    },
  ) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.pnlService.updateFromBalance(userId, body.projectId, body.updates);
  }
}
