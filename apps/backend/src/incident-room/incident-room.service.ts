import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncidentRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findMessages(incidentId: string) {
    const discussion = await this.getDiscussionForIncident(incidentId);
    const messages = await this.prisma.messages.findMany({
      where: { discussion_id: discussion.id },
      orderBy: { created_at: 'asc' },
      include: this.messageInclude,
    });

    return messages.map((message) => this.toMessageDto(message));
  }

  async createMessage(input: {
    body: string;
    incidentId: string;
    senderId: string;
  }) {
    const body = input.body.trim();

    if (!body) {
      throw new BadRequestException('Message body cannot be empty');
    }

    const [discussion, sender] = await Promise.all([
      this.getDiscussionForIncident(input.incidentId),
      this.prisma.users.findUnique({
        where: { id: input.senderId },
        select: { id: true },
      }),
    ]);

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = await this.prisma.messages.create({
      data: {
        discussion_id: discussion.id,
        sender_id: input.senderId,
        body,
      },
      include: this.messageInclude,
    });

    return this.toMessageDto(message);
  }

  private async getDiscussionForIncident(incidentId: string) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      select: {
        id: true,
        discussions: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const discussion = incident.discussions;

    if (discussion) {
      return discussion;
    }

    return this.prisma.discussions.create({
      data: {
        incident_id: incident.id,
        title: 'Incident Discussion',
      },
    });
  }

  private toMessageDto(message: MessageWithSender) {
    const primaryOrganisation =
      message.users.organisations ??
      message.users.user_organisations[0]?.organisations;
    const author =
      [message.users.first_name, message.users.last_name]
        .filter(Boolean)
        .join(' ') || message.users.username;

    return {
      id: message.id,
      discussionId: message.discussion_id,
      senderId: message.sender_id,
      author,
      role: primaryOrganisation?.org_name ?? message.users.role,
      body: message.body,
      createdAt: message.created_at,
    };
  }

  private get messageInclude() {
    return {
      users: {
        include: {
          organisations: true,
          user_organisations: {
            include: {
              organisations: true,
            },
          },
        },
      },
    } as const;
  }
}

type MessageWithSender = Awaited<
  ReturnType<PrismaService['messages']['findMany']>
>[number] & {
  users: {
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    organisations?: { org_name: string } | null;
    user_organisations: Array<{
      organisations: { org_name: string };
    }>;
  };
};
