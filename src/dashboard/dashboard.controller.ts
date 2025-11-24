// src/dashboard/dashboard.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard?projectId=<uuid>
   */
  @Get()
  async getDashboard(@Query('projectId') projectId: string) {
    return this.dashboardService.getDashboard(projectId);
  }
}
