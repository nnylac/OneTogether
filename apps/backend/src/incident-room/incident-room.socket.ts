import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';
import { IncidentRoomService } from './incident-room.service';

type IncidentRoomMessagePayload = {
  body?: string;
  incidentId?: string;
  senderId?: string;
};

type IncidentRoomMessageError = {
  message: string;
};

export function registerIncidentRoomSocket(
  httpServer: unknown,
  incidentRoomService: IncidentRoomService,
) {
  const logger = new Logger('IncidentRoomSocket');
  const io = new Server(httpServer as never, {
    cors: {
      origin: '*',
    },
  });

  // The API runs with multiple replicas behind a load balancer. A bare Socket.IO
  // server only broadcasts to clients connected to the same pod, so two responders
  // in the same incident room on different pods never see each other's messages.
  // The Redis adapter relays room broadcasts across every pod via pub/sub. This is
  // attached asynchronously and degrades to the in-memory adapter on failure — a
  // Redis outage must not take the socket server (or the pod) down.
  void attachRedisAdapter(io, logger);

  io.on('connection', (socket) => {
    socket.on('incident-room.join', (payload: { incidentId?: string }) => {
      if (payload.incidentId) {
        socket.join(roomName(payload.incidentId));
      }
    });

    socket.on(
      'incident-room.message.create',
      async (payload: IncidentRoomMessagePayload) => {
        if (!payload.incidentId || !payload.senderId || !payload.body) {
          return;
        }

        try {
          const message = await incidentRoomService.createMessage({
            incidentId: payload.incidentId,
            senderId: payload.senderId,
            body: payload.body,
          });

          io.to(roomName(payload.incidentId)).emit(
            'incident-room.message.created',
            message,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to send message';
          logger.warn(`Message creation failed: ${message}`);
          socket.emit('incident-room.message.error', {
            message,
          } satisfies IncidentRoomMessageError);
        }
      },
    );
  });

  return io;
}

async function attachRedisAdapter(io: Server, logger: Logger) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.log(
      'REDIS_URL not set; using in-memory socket adapter (single pod only)',
    );
    return;
  }

  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    // Don't let a transient Redis error escalate to an unhandled rejection.
    pubClient.on('error', (error) =>
      logger.warn(`Redis pub client error: ${asMessage(error)}`),
    );
    subClient.on('error', (error) =>
      logger.warn(`Redis sub client error: ${asMessage(error)}`),
    );

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.log('Socket.IO Redis adapter attached; cross-pod broadcast enabled');
  } catch (error) {
    logger.warn(
      `Failed to attach Redis adapter (${asMessage(error)}); falling back to in-memory adapter`,
    );
  }
}

function asMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown error';
}

function roomName(incidentId: string) {
  return `incident:${incidentId}`;
}
