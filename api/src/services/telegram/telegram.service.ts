import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UsersService } from '../user/users.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private isSimulated = false;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token.trim() === '' || token.includes('YOUR_TELEGRAM_BOT_TOKEN')) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set or placeholder. Telegram integration will run in SIMULATED mode.');
      this.isSimulated = true;
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.setupBotHandlers();
      this.bot.launch().catch(err => {
        this.logger.error('Failed to launch Telegram bot. Switching to SIMULATED mode.', err);
        this.isSimulated = true;
        this.bot = null;
      });
      this.logger.log('Telegram Bot successfully initialized and launched.');
    } catch (err) {
      this.logger.error('Error initializing Telegraf. Switching to SIMULATED mode.', err);
      this.isSimulated = true;
    }
  }

  private setupBotHandlers() {
    if (!this.bot) return;

    // Handle /start Command (supports deep linking /start <code>)
    this.bot.start(async (ctx) => {
      const startPayload = ctx.payload; // telegraf parses the parameter after "/start "
      const chatId = ctx.chat.id.toString();
      const username = ctx.from.username || ctx.from.first_name || 'User';

      this.logger.log(`Received /start command from chat ID: ${chatId}, username: ${username}, payload: ${startPayload}`);

      if (!startPayload) {
        await ctx.reply(
          `Welcome, ${username}! 🌦️\n\n` +
          `To link your WeatherGuard account, please use the link provided in your admin portal, or type:\n` +
          `/link <your_6_digit_code>`
        );
        return;
      }

      await this.processLinkCode(chatId, startPayload, async (msg) => {
        await ctx.reply(msg);
      });
    });

    // Handle /link <code>
    this.bot.command('link', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      const messageText = ctx.message.text.trim();
      const parts = messageText.split(/\s+/);
      const code = parts[1];

      if (!code) {
        await ctx.reply('Please provide your 6-digit verification code. Example:\n/link ABC123');
        return;
      }

      await this.processLinkCode(chatId, code, async (msg) => {
        await ctx.reply(msg);
      });
    });

    // Handle /weather (Get current weather status)
    this.bot.command('weather', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      const user = await this.usersService.findByTelegramChatId(chatId);

      if (!user) {
        await ctx.reply('Your Telegram account is not linked to any WeatherGuard account. Please link it first using your verification code.');
        return;
      }

      if (user.status !== 'approved') {
        await ctx.reply(`Your account status is currently: ${user.status.toUpperCase()}.\nYou will be able to check weather alerts once an admin approves your access.`);
        return;
      }

      await ctx.reply(`Current Weather Status for ${user.location}:\n☀️ Clear Sky, 22°C (Simulated request).`);
    });

    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(
        `WeatherGuard Bot Help:\n\n` +
        `/start <code> - Link your account during initial setup\n` +
        `/link <code> - Manually link your account using the 6-digit code\n` +
        `/weather - View current weather for your configured location\n` +
        `/help - Show this message`
      );
    });
  }

  private async processLinkCode(chatId: string, code: string, replyFn: (msg: string) => Promise<void>) {
    try {
      const user = await this.usersService.findByTelegramCode(code);
      if (!user) {
        await replyFn('❌ Invalid verification code. Please check the code in your WeatherGuard Admin Portal.');
        return;
      }

      // Link user
      await this.usersService.linkTelegram(code, chatId);

      let msg = `✅ Account successfully linked for ${user.name}!\n\n`;
      if (user.status === 'approved') {
        msg += `Your registration is APPROVED! You will now receive automated weather alerts for "${user.location}". Type /weather to see current weather.`;
      } else {
        msg += `Your registration status is: ${user.status.toUpperCase()}.\nWe will notify you here as soon as an Admin approves your access.`;
      }
      await replyFn(msg);
    } catch (err) {
      this.logger.error('Error linking Telegram code', err);
      await replyFn('❌ An error occurred while linking your account. Please try again later.');
    }
  }

  // Push notifications/alerts
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (this.isSimulated || !this.bot) {
      this.logger.log(`[SIMULATED TELEGRAM SEND] to ${chatId}: ${message}`);
      return true;
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send Telegram message to chat ${chatId}`, err);
      return false;
    }
  }

  // Send approval notification
  async notifyApproval(chatId: string, name: string, location: string) {
    const msg = `🎉 Congratulations, ${name}! Your WeatherGuard registration has been APPROVED by the admin.\n\nYou will now receive daily weather alerts for "${location}".\n\nType /weather to get the current forecast.`;
    await this.sendMessage(chatId, msg);
  }

  // Send rejection notification
  async notifyRejection(chatId: string, name: string) {
    const msg = `⚠️ Hello, ${name}. Your WeatherGuard registration request has been rejected by the admin. Please contact the administrator if you believe this was an error.`;
    await this.sendMessage(chatId, msg);
  }
}
