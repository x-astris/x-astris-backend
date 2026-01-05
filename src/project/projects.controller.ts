// src/project/projects.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Get all projects for the logged-in user
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProjects(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.projectsService.getProjectsByUser(userId);
  }

  /**
   * Get a single project by ID
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProject(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.projectsService.getProjectById(id, userId);
  }

  /**
   * Create a new project (RESTful)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProject(
    @Request() req,
    @Body() data: CreateProjectDto,
  ) {
    const userId = req.user.id || req.user.sub;

    return this.projectsService.createProject({
      userId,
      name: data.name,
      description: data.description,
      startYear: data.startYear,
      forecastYears: data.forecastYears ?? 5, // default naar 5 jaar
    });
  }

 /**
   * Update a project (name/description/forecastYears)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Request() req,
    @Body() data: { name?: string; description?: string; forecastYears?: number },
  ) {
    const userId = Number(req.user.id || req.user.sub);
    return this.projectsService.updateProject(id, userId, data);
  }

  /**
   * Delete a project
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteProject(@Param('id') id: string, @Request() req) {
    const userId = Number(req.user.id || req.user.sub);
    return this.projectsService.deleteProject(id, userId);
  }
}
