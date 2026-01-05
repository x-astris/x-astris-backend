import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EntitlementsService } from '../common/entitlements.service';

@Controller('me')
export class MeController {
  constructor(private entitlements: EntitlementsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async me(@Request() req) {
    const userId = Number(req.user.id || req.user.sub);
    return this.entitlements.getUserEntitlements(userId);
  }
}
