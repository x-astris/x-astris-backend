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

  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(email, password);
  }

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  // --------------------------------------------------------
  // ✅ NEW: POST verify-email (for frontend POST requests)
  // --------------------------------------------------------
  @Post('verify-email')
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // --------------------------------------------------------
  // ✅ NEW: GET verify-email (for clicking the email link)
  //      -> redirects the user to your frontend
  // --------------------------------------------------------
  @Get('verify-email')
async verifyEmailGet(
  @Query('token') token: string,
  @Res({ passthrough: true }) res: Response,
) {
  await this.authService.verifyEmail(token);
  res.redirect(`${process.env.APP_URL}/login?verified=1`);
}

  @Post('test')
  test() {
    return { ok: true };
  }
}
