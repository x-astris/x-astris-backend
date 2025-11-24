import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuratie voor zowel lokaal als live
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://x-astris-frontend.vercel.app',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // API prefix zodat alle routes onder /api vallen
  app.setGlobalPrefix('api');

  // Render vereist luisteren op process.env.PORT
  await app.listen(process.env.PORT || 3333);

  console.log('Backend running on PORT:', process.env.PORT || 3333);
}

bootstrap();
