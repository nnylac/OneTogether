import { Server } from 'socket.io';
import { IncidentRoomService } from './incident-room.service';

type IncidentRoomMessagePayload = {
  body?: string;
  incidentId?: string;
  senderId?: string;
};

export function registerIncidentRoomSocket(
  httpServer: unknown,
  incidentRoomService: IncidentRoomService,
) {
  const io = new Server(httpServer as never, {
    cors: {
      origin: '*',
    },
  });

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
        } catch {
          socket.emit('incident-room.message.error');
        }
      },
    );
  });

  return io;
}

function roomName(incidentId: string) {
  return `incident:${incidentId}`;
}
