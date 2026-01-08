// src/user/user.controller.ts

import {
  Controller,
  Get,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * GET /users
   * Returns the currently authenticated user only
   */
  @Get()
  async getMe(@Request() req) {
    const userId = Number(req.user?.id ?? req.user?.sub);
    if (!userId) {
      throw new BadRequestException('Invalid user token');
    }

    return this.userService.getUserById(userId);
  }
}
