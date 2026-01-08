// src/pnl/pnl.module.ts

import { Module } from '@nestjs/common';
import { PnlService } from './pnl.service';
import { PnlController } from './pnl.controller';

@Module({
  controllers: [PnlController],
  providers: [PnlService],
  exports: [PnlService],
})
export class PnlModule {}
