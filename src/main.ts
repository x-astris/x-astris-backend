import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
  'http://localhost:3000',
  'https://x-astris-frontend.vercel.app',
  'https://x-astris.com',
  'https://www.x-astris.com',
  'null'
],
      credentials: false,
      methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3333);
  console.log('Backend running on PORT:', process.env.PORT || 3333);
}
bootstrap();
