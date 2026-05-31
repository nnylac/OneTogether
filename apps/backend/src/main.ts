import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api');
  app.useStaticAssets(path.join(__dirname, '..', '..', 'uploads'), { prefix: '/uploads' });
  await app.listen(3001);
}

void bootstrap();
