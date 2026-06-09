import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  notification_recipients as NotificationRecipientModel,
  notifications as NotificationModel,
} from '../../generated/prisma/client';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<NotificationsRepository>;
  let gateway: { emitCreated: jest.Mock };

  const recipientModel: NotificationRecipientModel = {
    id: '30000000-0000-0000-0000-000000000002',
    notification_id: '30000000-0000-0000-0000-000000000001',
    recipient_type: 'organisation',
    recipient_id: '10000000-0000-0000-0000-000000000001',
    recipient_role: null,
    is_read: false,
    read_at: null,
  };

  const notificationModel: NotificationModel & {
    notification_recipients: NotificationRecipientModel[];
  } = {
    id: '30000000-0000-0000-0000-000000000001',
    title: 'Incident assigned',
    message: 'A kitchen fire incident has been assigned.',
    notification_type: 'incident_assigned',
    reference_type: 'incident',
    reference_id: '20000000-0000-0000-0000-000000000001',
    created_at: new Date('2026-06-07T10:00:00.000Z'),
    notification_recipients: [recipientModel],
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findRecipientById: jest.fn(),
      markRecipientAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationsRepository>;

    gateway = { emitCreated: jest.fn() };
    service = new NotificationsService(repository, gateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list mapped notifications with filters', async () => {
    repository.findMany.mockResolvedValue([notificationModel]);

    await expect(
      service.findAll({
        recipientType: 'organisation',
        recipientId: recipientModel.recipient_id!,
        isRead: 'false',
        take: '10',
        skip: '0',
      }),
    ).resolves.toEqual([
      {
        id: notificationModel.id,
        title: notificationModel.title,
        message: notificationModel.message,
        notificationType: notificationModel.notification_type,
        referenceType: notificationModel.reference_type,
        referenceId: notificationModel.reference_id,
        createdAt: notificationModel.created_at,
        recipients: [
          {
            id: recipientModel.id,
            recipientType: recipientModel.recipient_type,
            recipientId: recipientModel.recipient_id,
            recipientRole: recipientModel.recipient_role,
            isRead: recipientModel.is_read,
            readAt: recipientModel.read_at,
          },
        ],
      },
    ]);
    expect(repository.findMany.mock.calls[0]).toEqual([
      {
        recipientType: 'organisation',
        recipientId: recipientModel.recipient_id,
        recipientRole: undefined,
        isRead: false,
        notificationType: undefined,
        take: 10,
        skip: 0,
      },
    ]);
  });

  it('should throw when notification is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(notificationModel.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should not emit when reading one notification', async () => {
    repository.findById.mockResolvedValue(notificationModel);

    await expect(service.findOne(notificationModel.id)).resolves.toMatchObject({
      id: notificationModel.id,
    });
    expect(gateway.emitCreated).not.toHaveBeenCalled();
  });

  it('should create one notification with organisation recipient', async () => {
    repository.create.mockResolvedValue(notificationModel);

    await expect(
      service.create({
        title: '  Incident assigned  ',
        message: '  A kitchen fire incident has been assigned.  ',
        notificationType: 'incident_assigned',
        referenceType: 'incident',
        referenceId: notificationModel.reference_id!,
        recipients: [
          {
            recipientType: 'organisation',
            recipientId: recipientModel.recipient_id!,
          },
        ],
      }),
    ).resolves.toMatchObject({
      id: notificationModel.id,
      notificationType: 'incident_assigned',
    });
    expect(repository.create.mock.calls[0]).toEqual([
      {
        title: 'Incident assigned',
        message: 'A kitchen fire incident has been assigned.',
        notification_type: 'incident_assigned',
        reference_type: 'incident',
        reference_id: notificationModel.reference_id,
        notification_recipients: {
          create: [
            {
              recipient_type: 'organisation',
              recipient_id: recipientModel.recipient_id,
              recipient_role: undefined,
            },
          ],
        },
      },
    ]);
    expect(gateway.emitCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        id: notificationModel.id,
        notificationType: 'incident_assigned',
      }),
    );
  });

  it('should create one notification with role recipient', async () => {
    repository.create.mockResolvedValue({
      ...notificationModel,
      notification_recipients: [
        {
          ...recipientModel,
          recipient_type: 'role',
          recipient_id: null,
          recipient_role: 'government',
        },
      ],
    });

    await expect(
      service.create({
        title: 'New broadcast',
        message: 'A new broadcast is available.',
        notificationType: 'broadcast_created',
        recipients: [{ recipientType: 'role', recipientRole: 'government' }],
      }),
    ).resolves.toMatchObject({
      recipients: [{ recipientType: 'role', recipientRole: 'government' }],
    });
  });

  it('should reject role recipients with recipientId', async () => {
    await expect(
      service.create({
        title: 'New broadcast',
        message: 'A new broadcast is available.',
        notificationType: 'broadcast_created',
        recipients: [
          {
            recipientType: 'role',
            recipientId: '50000000-0000-0000-0000-000000000001',
            recipientRole: 'government',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should mark one recipient as read', async () => {
    repository.findRecipientById.mockResolvedValue(recipientModel);
    repository.markRecipientAsRead.mockResolvedValue({
      ...recipientModel,
      is_read: true,
      read_at: new Date('2026-06-07T11:00:00.000Z'),
    });

    await expect(
      service.markRecipientAsRead(recipientModel.id),
    ).resolves.toEqual({
      id: recipientModel.id,
      isRead: true,
      readAt: new Date('2026-06-07T11:00:00.000Z'),
    });
  });

  it('should mark all matching recipients as read', async () => {
    repository.markAllAsRead.mockResolvedValue({ count: 2 });

    await expect(
      service.markAllAsRead({
        recipientType: 'organisation',
        recipientId: recipientModel.recipient_id!,
      }),
    ).resolves.toEqual({ count: 2 });
    expect(repository.markAllAsRead.mock.calls[0]).toEqual([
      {
        recipientType: 'organisation',
        recipientId: recipientModel.recipient_id,
        recipientRole: undefined,
        notificationType: undefined,
        isRead: false,
      },
    ]);
  });

  it('should mark all matching alert notifications as read', async () => {
    repository.markAllAsRead.mockResolvedValue({ count: 1 });

    await expect(
      service.markAllAsRead({
        recipientType: 'role',
        recipientRole: 'government',
        notificationType: 'government_alert_triggered',
      }),
    ).resolves.toEqual({ count: 1 });
    expect(repository.markAllAsRead.mock.calls[0]).toEqual([
      {
        recipientType: 'role',
        recipientId: undefined,
        recipientRole: 'government',
        notificationType: 'government_alert_triggered',
        isRead: false,
      },
    ]);
  });
});
