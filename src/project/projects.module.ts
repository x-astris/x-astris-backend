// src/project/projects.module.ts

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';  // ⬅ REQUIRED

@Module({
  imports: [
    PrismaModule,
    AuthModule,     // ⬅ THIS IS THE FIX
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
