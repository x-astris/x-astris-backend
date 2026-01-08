// src/dashboard/dashboard.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard?projectId=<uuid>
   */
  @Get()
  async getDashboard(
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

    return this.dashboardService.getDashboard(userId, projectId);
  }
}
