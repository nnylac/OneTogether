import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { IncidentRoomService } from './incident-room/incident-room.service';
import { registerIncidentRoomSocket } from './incident-room/incident-room.socket';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), 'apps/backend/.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OneTogether API')
    .setDescription(
      'Backend API documentation for the OneTogether emergency response platform.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api/docs-json',
  });

  // K8s liveness/readiness probe endpoint
  app.use('/api/health', (_req: unknown, res: { json: (o: object) => void }) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  registerIncidentRoomSocket(
    app.getHttpServer(),
    app.get(IncidentRoomService),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
