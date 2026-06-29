import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AuthController } from './controllers/auth/auth.controller';
import { AdminController } from './controllers/admin/admin.controller';

// Services
import { AuthService } from './services/auth/auth.service';
import { UsersService } from './services/user/users.service';
import { TelegramService } from './services/telegram/telegram.service';
import { WeatherService } from './services/weather/weather.service';
import { SchedulerService } from './services/scheduler/scheduler.service';

// Model / Schema
import { User, UserSchema } from './db/models/user.model';

// Strategies & Guards
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Database connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/weatherguard',
      }),
    }),

    // Model registration
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),

    // Cron Scheduling
    ScheduleModule.forRoot(),

    // Passport / JWT setup
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    AdminController,
  ],
  providers: [
    AuthService,
    UsersService,
    TelegramService,
    WeatherService,
    SchedulerService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
  ],
})
export class AppModule {}
