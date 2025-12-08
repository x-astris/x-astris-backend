import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // --------------------------------------------------------
  // REGISTER
  // --------------------------------------------------------
  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(email, password);
  }

  // --------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------
  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  // --------------------------------------------------------
  // VERIFY EMAIL (POST) - frontend API usage
  // --------------------------------------------------------
  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // --------------------------------------------------------
  // VERIFY EMAIL (GET) - clicked from email
  // Redirects user back to your front-end
  // --------------------------------------------------------
  @Get('verify-email')
  async verifyEmailGet(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.verifyEmail(token);
    res.redirect(`${process.env.APP_URL}/login?verified=1`);
  }

  // --------------------------------------------------------
  // REQUEST PASSWORD RESET
  // --------------------------------------------------------
  @Post('request-reset')
  requestReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // --------------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------------
  @Post('reset-password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  // TEST ROUTE
  @Post('test')
  test() {
    return { ok: true };
  }
}
