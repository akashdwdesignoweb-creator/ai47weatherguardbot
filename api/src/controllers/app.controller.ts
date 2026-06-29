import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'healthy',
      service: 'WeatherGuard Admin API',
      version: '1.0.0',
      message: 'Welcome to the WeatherGuard Alert Service API. Deployed successfully!',
    };
  }
}
