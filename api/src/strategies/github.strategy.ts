import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID') || 'dummy-github-client-id';
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET') || 'dummy-github-client-secret';
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:5000/api/auth/github/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });

    if (clientID === 'dummy-github-client-id') {
      this.logger.warn('GITHUB_CLIENT_ID is not configured. Real GitHub login will fail until keys are provided.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { username, displayName, emails, photos } = profile;
    
    // GitHub profile email can sometimes be null if private, fall back to username placeholder
    const email = emails && emails[0] ? emails[0].value : `${username}@github.com`;
    
    const user = {
      email,
      name: displayName || username || 'GitHub User',
      avatarUrl: photos && photos[0] ? photos[0].value : `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      accessToken,
    };
    done(null, user);
  }
}
