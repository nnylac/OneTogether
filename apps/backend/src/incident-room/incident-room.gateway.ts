import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { AiChatService } from '../ai/ai-chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentsService } from '../incidents/incidents.service';
import { ReportsService } from '../reports/reports.service';

interface JoinRoomPayload {
  incidentId: string;
  userId: string;
  userName: string;
}

interface SendMessagePayload {
  incidentId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
}

interface UpdateResourcePayload {
  incidentId: string;
  unitId: string;
  status: string;
}

interface UpdateStatusPayload {
  incidentId: string;
  status: string;
  actorId: string;
  actorName: string;
  actorOrg?: string;
}

@WebSocketGateway({ namespace: '/incident-room', cors: { origin: '*' } })
export class IncidentRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(IncidentRoomGateway.name);

  // socketId → { userId, userName, incidentId }
  private socketMeta = new Map<string, { userId: string; userName: string; incidentId: string }>();

  constructor(
    private chat: ChatService,
    private aiChat: AiChatService,
    private prisma: PrismaService,
    private incidents: IncidentsService,
    private reports: ReportsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (meta) {
      await this.removeParticipant(meta.incidentId, meta.userId, meta.userName);
      this.socketMeta.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { incidentId, userId, userName } = payload;
    await client.join(`incident:${incidentId}`);
    this.socketMeta.set(client.id, { userId, userName, incidentId });

    await this.prisma.incidentParticipant.upsert({
      where: { incidentId_userId: { incidentId, userId } },
      create: { incidentId, userId, userName },
      update: { lastSeenAt: new Date(), userName },
    });

    const participants = await this.prisma.incidentParticipant.findMany({ where: { incidentId } });
    this.server.to(`incident:${incidentId}`).emit('participants-update', participants);

    // System timeline entry
    const tl = await this.incidents.addTimelineEvent(incidentId, {
      actor: userName,
      organisation: 'System',
      category: 'SYSTEM',
      text: `${userName} joined the incident room.`,
    });
    this.server.to(`incident:${incidentId}`).emit('new-timeline-event', tl);

    this.logger.log(`${userName} joined room incident:${incidentId}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { incidentId: string; userId: string; userName: string },
  ) {
    await client.leave(`incident:${payload.incidentId}`);
    await this.removeParticipant(payload.incidentId, payload.userId, payload.userName);
    this.socketMeta.delete(client.id);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const { incidentId, content, senderId, senderName, senderRole } = payload;

    // Persist and broadcast human message
    const message = await this.chat.saveMessage({
      incidentId,
      senderId,
      senderName,
      senderRole,
      content,
    });
    this.server.to(`incident:${incidentId}`).emit('new-message', message);

    // Check for AI trigger
    const isAiMention = /^@ai\b/i.test(content.trim()) || /^\/[a-z-]+/i.test(content.trim());
    if (isAiMention) {
      this.server.to(`incident:${incidentId}`).emit('ai-thinking', { incidentId });

      // Run AI asynchronously so socket doesn't block
      this.aiChat.handleMention(incidentId, content).then(async (aiResponse) => {
        const command = this.aiChat.detectCommand(content);
        const aiMsg = await this.chat.saveMessage({
          incidentId,
          senderName: 'AI Assistant',
          content: aiResponse,
          isAi: true,
          aiCommand: command === 'freeform' ? undefined : command,
        });
        this.server.to(`incident:${incidentId}`).emit('new-message', aiMsg);
      }).catch((err) => {
        this.logger.error('AI response failed', err);
        this.server.to(`incident:${incidentId}`).emit('error', { code: 'AI_ERROR', message: 'AI response failed.' });
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { incidentId: string; userId: string; userName: string },
  ) {
    // Broadcast to room except sender
    client.to(`incident:${payload.incidentId}`).emit('typing', {
      userId: payload.userId,
      userName: payload.userName,
    });
  }

  @SubscribeMessage('update-resource')
  async handleUpdateResource(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: UpdateResourcePayload,
  ) {
    const { incidentId, unitId, status } = payload;
    const assignment = await this.incidents.updateUnitStatus(incidentId, unitId, status);
    this.server.to(`incident:${incidentId}`).emit('resource-updated', assignment);
  }

  @SubscribeMessage('update-incident-status')
  async handleUpdateStatus(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: UpdateStatusPayload,
  ) {
    const { incidentId, status, actorName, actorOrg } = payload;
    const updated = await this.incidents.update(incidentId, { status });
    this.server.to(`incident:${incidentId}`).emit('incident-updated', { id: incidentId, status });

    const tl = await this.incidents.addTimelineEvent(incidentId, {
      actor: actorName,
      organisation: actorOrg ?? 'System',
      category: 'STATUS',
      text: `Status updated to ${status} by ${actorName}.`,
    });
    this.server.to(`incident:${incidentId}`).emit('new-timeline-event', tl);

    return updated;
  }

  // ── Report collaboration events ──────────────────────────────────────────

  @SubscribeMessage('report-update')
  async handleReportUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reportId: string; incidentId: string; content: string; userId: string; userName: string },
  ) {
    const { reportId, incidentId, content, userName } = payload;
    const updated = await this.reports.update(reportId, content);
    // Broadcast to everyone else in the room
    client.to(`incident:${incidentId}`).emit('report-updated', { reportId, content, version: updated.version, updatedBy: userName });
  }

  @SubscribeMessage('report-cursor')
  handleReportCursor(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reportId: string; incidentId: string; userId: string; userName: string; position: number; color: string },
  ) {
    client.to(`incident:${payload.incidentId}`).emit('report-cursor', payload);
  }

  @SubscribeMessage('report-finalize')
  async handleReportFinalize(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: { reportId: string; incidentId: string; userId: string; userName: string },
  ) {
    const { reportId, incidentId, userId, userName } = payload;
    const report = await this.reports.finalize(reportId, userId, userName, incidentId);
    const tl = await this.incidents.addTimelineEvent(incidentId, {
      actor: userName, organisation: 'System', category: 'CLOSE',
      text: `Incident report finalized by ${userName}.`,
    });
    this.server.to(`incident:${incidentId}`).emit('report-finalized', { reportId, finalizedBy: userName });
    this.server.to(`incident:${incidentId}`).emit('new-timeline-event', tl);
    return report;
  }

  @SubscribeMessage('report-ai-suggest')
  async handleReportAiSuggest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reportId: string; incidentId: string; selectedText: string; question: string; fullContent: string },
  ) {
    const { incidentId, selectedText, question, fullContent } = payload;
    client.emit('report-ai-thinking', { incidentId });
    try {
      const suggestion = await this.aiChat.suggestReportEdit(incidentId, selectedText, question, fullContent);
      client.emit('report-ai-suggestion', { selectedText, suggestion });
    } catch {
      client.emit('report-ai-suggestion', { selectedText, suggestion: 'AI suggestion unavailable. Please try again.' });
    }
  }

  private async removeParticipant(incidentId: string, userId: string, userName: string) {
    try {
      await this.prisma.incidentParticipant.delete({
        where: { incidentId_userId: { incidentId, userId } },
      });
    } catch {
      // Participant may have already been removed
    }

    const participants = await this.prisma.incidentParticipant.findMany({ where: { incidentId } });
    this.server.to(`incident:${incidentId}`).emit('participants-update', participants);

    const tl = await this.incidents.addTimelineEvent(incidentId, {
      actor: userName,
      organisation: 'System',
      category: 'SYSTEM',
      text: `${userName} left the incident room.`,
    });
    this.server.to(`incident:${incidentId}`).emit('new-timeline-event', tl);
  }
}
