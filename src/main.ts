import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import helmet from 'helmet';
import { authRateLimit } from './common/rate-limit/auth-rate-limit';

async function bootstrap() {
 
    if (!process.env.JWT_SECRET) {
  throw new Error('Missing env var: JWT_SECRET');
}

  const app = await NestFactory.create(AppModule, {
    // Belangrijk: anders zet Nest automatisch express.json() aan voor ALLES
    bodyParser: false,
    cors: {
      origin: [
        'http://localhost:3000',
        'https://x-astris-frontend.vercel.app',
        'https://x-astris.com',
        'https://www.x-astris.com',
      ],
      credentials: false,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  app.use(helmet());

  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

  app.setGlobalPrefix('api');

  app.use('/api/auth/login', authRateLimit);
  app.use('/api/auth/reset-password', authRateLimit);

  // ✅ Stripe webhook: raw body nodig voor signature verify
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

  // ✅ Voor alle andere routes: normale JSON parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  await app.listen(process.env.PORT || 3333);
  console.log('Backend running on PORT:', process.env.PORT || 3333);
}
bootstrap();
