import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import type { GoogleProfile } from './strategies/google.strategy';

type GoogleRequest = Request & { user: GoogleProfile };

// Throttle plus strict que le defaut global (100/60s) sur les endpoints
// sensibles au bruteforce - signup/login.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly config: ConfigService,
  ) {}

  @Throttle(AUTH_THROTTLE)
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {
    // redirection geree par passport-google-oauth20
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: GoogleRequest, @Res() res: Response) {
    const result = await this.auth.loginWithGoogle(req.user);
    const webOrigin = this.config.getOrThrow<string>('WEB_ORIGIN');
    res.redirect(`${webOrigin}/auth/callback#token=${result.accessToken}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.users.findById(currentUser.userId);
    const role = await this.roles.findByUserId(currentUser.userId);
    return { user, role };
  }
}
