import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: '*', // For local dev, allow all origins. In production, restrict this.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Set global prefix for API routes (excluding root path)
  app.setGlobalPrefix('api', { exclude: ['/'] });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  
  await app.listen(port);
  console.log(`WeatherGuard API is running on: http://localhost:${port}/api`);
}
bootstrap();
