import { Test, TestingModule } from '@nestjs/testing';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const notification: NotificationResponseDto = {
    id: '30000000-0000-0000-0000-000000000001',
    title: 'Incident assigned',
    message: 'A kitchen fire incident has been assigned.',
    notificationType: 'incident_assigned',
    referenceType: 'incident',
    referenceId: '20000000-0000-0000-0000-000000000001',
    createdAt: new Date('2026-06-07T10:00:00.000Z'),
    recipients: [
      {
        id: '30000000-0000-0000-0000-000000000002',
        recipientType: 'organisation',
        recipientId: '10000000-0000-0000-0000-000000000001',
        recipientRole: null,
        isRead: false,
        readAt: null,
      },
    ],
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      markRecipientAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list notifications', async () => {
    const query: NotificationQueryDto = { recipientType: 'organisation' };
    service.findAll.mockResolvedValue([notification]);

    await expect(controller.findAll(query)).resolves.toEqual([notification]);
    expect(service.findAll.mock.calls[0]).toEqual([query]);
  });

  it('should get one notification', async () => {
    service.findOne.mockResolvedValue(notification);

    await expect(controller.findOne(notification.id)).resolves.toEqual(
      notification,
    );
    expect(service.findOne.mock.calls[0]).toEqual([notification.id]);
  });

  it('should create one notification', async () => {
    const dto: CreateNotificationDto = {
      title: notification.title,
      message: notification.message,
      notificationType: notification.notificationType,
      recipients: [
        {
          recipientType: 'organisation',
          recipientId: notification.recipients[0].recipientId!,
        },
      ],
    };
    service.create.mockResolvedValue(notification);

    await expect(controller.create(dto)).resolves.toEqual(notification);
    expect(service.create.mock.calls[0]).toEqual([dto]);
  });

  it('should mark one recipient as read', async () => {
    const recipient = notification.recipients[0];
    service.markRecipientAsRead.mockResolvedValue({
      id: recipient.id,
      isRead: true,
      readAt: new Date('2026-06-07T11:00:00.000Z'),
    });

    await expect(controller.markRecipientAsRead(recipient.id)).resolves.toEqual(
      {
        id: recipient.id,
        isRead: true,
        readAt: new Date('2026-06-07T11:00:00.000Z'),
      },
    );
    expect(service.markRecipientAsRead.mock.calls[0]).toEqual([recipient.id]);
  });

  it('should mark all matching recipients as read', async () => {
    const dto: MarkNotificationsReadDto = {
      recipientType: 'organisation',
      recipientId: notification.recipients[0].recipientId!,
    };
    service.markAllAsRead.mockResolvedValue({ count: 2 });

    await expect(controller.markAllAsRead(dto)).resolves.toEqual({ count: 2 });
    expect(service.markAllAsRead.mock.calls[0]).toEqual([dto]);
  });
});
