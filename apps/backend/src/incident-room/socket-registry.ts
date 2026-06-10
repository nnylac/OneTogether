import type { Server } from 'socket.io';

// The incident-room Socket.IO server is created in main.ts outside the Nest DI
// container. This registry lets injectable services (e.g. classification
// refinement) emit best-effort room broadcasts without restructuring the
// socket bootstrap.
let incidentSocketServer: Server | null = null;

export function setIncidentSocketServer(io: Server) {
  incidentSocketServer = io;
}

export function getIncidentSocketServer(): Server | null {
  return incidentSocketServer;
}
