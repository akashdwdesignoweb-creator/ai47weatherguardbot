import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../user/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateSocialLogin(email: string, name: string, avatarUrl?: string): Promise<{ accessToken: string; user: any }> {
    // Check if user exists or create them (social OAuth flow)
    const user = await this.usersService.findOrCreateSocialUser(email, name, avatarUrl);

    // Sign the JWT
    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async validateLocalLogin(email: string, password: string): Promise<{ accessToken: string; user: any }> {
    // Retrieve user with password hash
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    // Sign the JWT
    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Remove password field from user object in response
    const userObj = user.toObject();
    delete userObj.password;

    return {
      accessToken,
      user: userObj,
    };
  }
}
