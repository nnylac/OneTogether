import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { IncidentRoomService } from './incident-room/incident-room.service';
import { registerIncidentRoomSocket } from './incident-room/incident-room.socket';
import { setIncidentSocketServer } from './incident-room/socket-registry';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), 'apps/backend/.env') });

// Background tasks (resource polling, incident pollers) issue DB queries that can
// reject with transient errors like Prisma SocketTimeout. An unhandled rejection
// crashes the Node process (exit 1) and crash-loops the pod. Log and keep serving
// instead — a single failed background query must not take the API down.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});

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

  setIncidentSocketServer(
    registerIncidentRoomSocket(
      app.getHttpServer(),
      app.get(IncidentRoomService),
    ),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
