// src/balance/balance.module.ts

import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BalanceController],
  providers: [BalanceService, PrismaService],
  exports: [BalanceService],
})
export class BalanceModule {}
