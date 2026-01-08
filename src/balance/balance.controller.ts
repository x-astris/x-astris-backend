// src/balance/balance.controller.ts

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
import { BalanceService } from './balance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBalanceDto } from './dto/create-balance.dto';

@UseGuards(JwtAuthGuard) // ✅ everything in this controller requires login
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  /**
   * POST /balance/create
   */
@Post('create')
async createBalance(@Request() req, @Body() body: CreateBalanceDto) {
  const userId = Number(req.user.id ?? req.user.sub);
  return this.balanceService.createBalance(userId, body);
}

  /**
   * GET /balance?projectId=abc-uuid
   */
  @Get()
  async getBalances(@Request() req, @Query('projectId') projectId: string) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.balanceService.getByProject(userId, projectId);
  }

  /**
   * DELETE /balance?projectId=abc-uuid
   */
  @Delete()
  async deleteBalances(@Request() req, @Query('projectId') projectId: string) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.balanceService.deleteByProject(userId, projectId);
  }

  /**
   * PATCH /balance/update-ratio
   */
  @Patch('update-ratio')
  async updateRatio(
    @Request() req,
    @Body()
    body: {
      projectId: string;
      year: number;
      field: string; // e.g. "ratioDio"
      value: number;
    },
  ) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.balanceService.updateRatio(userId, body);
  }

  /**
   * (Optional, if you use it) PATCH /balance/update-single
   * Only include this route if the frontend calls updateSingle().
   */
  @Patch('update-single')
  async updateSingle(
    @Request() req,
    @Body()
    body: {
      projectId: string;
      year: number;
      field: string; // e.g. "cash"
      value: number;
    },
  ) {
    const userId = Number(req.user.id ?? req.user.sub);
    return this.balanceService.updateSingle(userId, body);
  }
}
