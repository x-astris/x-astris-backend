// src/pnl/pnl.controller.ts
import { Controller, Post, Body, Get, Query, Delete, Patch } from '@nestjs/common';
import { PnlService } from './pnl.service';

@Controller('pnl')
export class PnlController {
  constructor(private readonly pnlService: PnlService) {}

@Post('add')
async addPnlRecord(
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

  }
) {
  return this.pnlService.addYear(body);
}

  @Get()
  async getForProject(@Query('projectId') projectId: string) {
    return this.pnlService.getForProject(projectId);
  }

  @Get('single')
  async getSingle(@Query('id') id: string) {
    return this.pnlService.getById(Number(id));
  }

  @Delete()
  async deleteForProject(@Query('projectId') projectId: string) {
    return this.pnlService.deleteForProject(projectId);
  }

  // ⭐ NEW PATCH ENDPOINT
  @Patch('update')
  async updatePnlValue(
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
    }
  ) {
    return this.pnlService.updateSingle(body);
  }

  // already existing:
  @Post("update-from-balance")
  async updateFromBalance(
    @Body()
    body: {
      projectId: string;
      updates: { year: number; depreciation: number; interest: number }[];
    }
  ) {
    return this.pnlService.updateFromBalance(body.projectId, body.updates);
  }
}
