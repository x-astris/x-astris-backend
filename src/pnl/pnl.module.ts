// src/pnl/pnl.module.ts

import { Module } from '@nestjs/common';
import { PnlService } from './pnl.service';
import { PnlController } from './pnl.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PnlController],
  providers: [PnlService, PrismaService],
  exports: [PnlService],
})
export class PnlModule {}
