import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../user/users.service';
import { WeatherService } from '../weather/weather.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private usersService: UsersService,
    private weatherService: WeatherService,
    private telegramService: TelegramService,
  ) {}

  // Run every 30 seconds for quick local demonstration and validation.
  // In production, this might run once daily (e.g. '0 8 * * *' for 8:00 AM)
  // @Cron('0 8 * * *')
  @Cron('*/30 * * * * *') // Every 30 seconds for demonstration
  async handleWeatherAlerts() {
    this.logger.log('Scheduler triggered: Fetching and dispatching weather alerts...');

    try {
      const approvedUsers = await this.usersService.findApprovedUsersWithTelegram();

      if (approvedUsers.length === 0) {
        this.logger.log('No approved users with linked Telegram accounts found.');
        return;
      }

      this.logger.log(`Found ${approvedUsers.length} users to notify. Dispatching alerts...`);

      for (const user of approvedUsers) {
        try {
          const weather = await this.weatherService.getWeather(user.location);
          
          const alertMessage = 
            `🌦️ *WeatherGuard Alert for ${user.location}* 🌦️\n\n` +
            `• *Condition:* ${this.capitalize(weather.description)}\n` +
            `• *Temperature:* ${weather.temp}°C (Feels like ${weather.feelsLike}°C)\n` +
            `• *Humidity:* ${weather.humidity}%\n` +
            `• *Wind Speed:* ${weather.windSpeed} m/s\n\n` +
            `Have a wonderful day and stay weather-aware! 🛡️`;

          await this.telegramService.sendMessage(user.telegramChatId!, alertMessage);
          this.logger.log(`Alert sent successfully to ${user.name} (${user.email}) for location "${user.location}".`);
        } catch (err) {
          this.logger.error(`Error sending weather alert to user ${user.name} (${user.email})`, err);
        }
      }
    } catch (err) {
      this.logger.error('Error in weather alert scheduler', err);
    }
  }

  private capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
