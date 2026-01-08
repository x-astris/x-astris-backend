// src/me/me.controller.ts

import {
  Controller,
  Get,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntitlementsService } from '../common/entitlements.service';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get()
  async me(@Request() req) {
    const userId = Number(req.user?.id ?? req.user?.sub);
    if (!userId) {
      throw new BadRequestException('Invalid user token');
    }
    return this.entitlements.getUserEntitlements(userId);
  }
}
