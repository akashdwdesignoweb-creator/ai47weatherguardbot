import { Controller, Post, Get, Put, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { AuthService } from '../../services/auth/auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UsersService } from '../../services/user/users.service';
import { UpdateLocationDto } from '../../dto/auth/update-location.dto';
import { LocalRegisterDto } from '../../dto/auth/local-register.dto';
import { LocalLoginDto } from '../../dto/auth/local-login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  // Local signup endpoint
  @Post('register')
  async register(@Body() localRegisterDto: LocalRegisterDto) {
    const { email, name, password } = localRegisterDto;
    const user = await this.usersService.create(email, name, undefined, 'user', password);
    
    // Hide password before returning
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  // Local login endpoint
  @Post('login')
  async login(@Body() localLoginDto: LocalLoginDto) {
    const { email, password } = localLoginDto;
    return this.authService.validateLocalLogin(email, password);
  }

  // Google OAuth triggers redirect to Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  // Google OAuth Callback handles redirection back to frontend
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: express.Response) {
    const { email, name, avatarUrl } = req.user;
    const authData = await this.authService.validateSocialLogin(email, name, avatarUrl);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}?token=${authData.accessToken}`);
  }

  // GitHub OAuth triggers redirect to GitHub
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  // GitHub OAuth Callback handles redirection back to frontend
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req, @Res() res: express.Response) {
    const { email, name, avatarUrl } = req.user;
    const authData = await this.authService.validateSocialLogin(email, name, avatarUrl);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}?token=${authData.accessToken}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('location')
  async updateLocation(@Req() req, @Body() updateLocationDto: UpdateLocationDto) {
    const { location } = updateLocationDto;
    return this.usersService.updateLocation(req.user._id, location);
  }

  @UseGuards(JwtAuthGuard)
  @Put('telegram/unlink')
  async unlinkTelegram(@Req() req) {
    return this.usersService.unlinkTelegram(req.user._id);
  }
}
