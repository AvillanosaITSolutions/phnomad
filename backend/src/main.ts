import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const enableHttps =
    String(process.env.ENABLE_HTTPS ?? 'true').toLowerCase() === 'true';
  let app;

  if (enableHttps) {
    // Determine the certs path based on environment.
    const isDocker = fs.existsSync('/.dockerenv');
    const certsPath = isDocker
      ? '/app/certs'
      : path.join(process.cwd(), 'certs');

    const httpsOptions = {
      key: fs.readFileSync(path.join(certsPath, 'key.pem')),
      cert: fs.readFileSync(path.join(certsPath, 'cert.pem')),
    };

    app = await NestFactory.create(AppModule, {
      httpsOptions,
    });
  } else {
    app = await NestFactory.create(AppModule);
  }

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'https://localhost:5173',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Backend running on ${enableHttps ? 'https' : 'http'}://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
