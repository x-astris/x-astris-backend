// src/project/projects.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all projects belonging to the user
   */
  async getProjectsByUser(userId: string | number) {
    return this.prisma.project.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific project by ID, ONLY if it belongs to the user
   */
  async getProjectById(id: string, userId: string | number) {
    return this.prisma.project.findFirst({
      where: {
        id: String(id),
        userId: Number(userId),
      },
    });
  }

  /**
   * Create a new project
   */
  async createProject(data: {
    userId: string | number;
    name: string;
    startYear: number;
    description?: string;
    forecastYears?: number;     // <-- NIEUW
  }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        startYear: data.startYear,
        forecastYears: data.forecastYears ?? 5,   // <-- SAVE TO DB
        userId: Number(data.userId),
      },
    });
  }

  /**
   * Delete a project if it belongs to the user
   */
  async deleteProject(id: string, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: String(id),
        userId: Number(userId),
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied.');
    }

    await this.prisma.project.delete({
      where: { id: String(id) },
    });

    return { success: true };
  }
}
