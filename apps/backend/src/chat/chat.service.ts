import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(incidentId: string, cursor?: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async saveMessage(data: {
    incidentId: string;
    senderId?: string;
    senderName: string;
    senderRole?: string;
    content: string;
    isAi?: boolean;
    aiCommand?: string;
  }) {
    return this.prisma.chatMessage.create({ data });
  }
}
