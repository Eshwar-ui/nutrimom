import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap() {
  // rawBody: true keeps the exact request bytes available (req.rawBody) so the
  // Razorpay webhook can verify its HMAC signature against what was actually sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService<Env, true>);

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  console.log(`nutrimom-api listening on http://localhost:${port}`);
}
bootstrap();
