import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOriginPatterns = [
    /^http:\/\/localhost(?::\d+)?$/,
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
    /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/,
    /^https:\/\/[a-z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-z0-9-]+\.lhr\.life$/,
    /^https:\/\/[a-z0-9-]+\.localhost\.run$/,
  ];

  if (process.env.FRONTEND_URL) {
    try {
      const url = new URL(process.env.FRONTEND_URL);
      allowedOriginPatterns.push(new RegExp('^' + process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    } catch (e) {
      console.error('Invalid FRONTEND_URL environment variable', process.env.FRONTEND_URL);
    }
  }

  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOriginPatterns.some((pattern) =>
        pattern.test(origin),
      );

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
