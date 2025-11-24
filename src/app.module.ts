import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './project/projects.module';
import { PnlModule } from './pnl/pnl.module';
import { BalanceModule } from './balance/balance.module';
import { CashflowModule } from './cashflow/cashflow.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';
import { JwtStrategy } from './auth/jwt.strategy';  // ⬅ ADD THIS

@Module({
  imports: [
    UserModule,
    AuthModule,
    PrismaModule,
    ProjectsModule,
    PnlModule,
    BalanceModule,
    CashflowModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy],  // ⬅ ADD THIS
})
export class AppModule {}
