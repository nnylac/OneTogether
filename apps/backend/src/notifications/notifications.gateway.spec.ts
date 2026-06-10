import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsGateway],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('emits created notifications through the shared socket server', () => {
    const notification = { id: 'notification-id' };
    const emit = jest.fn();
    jest
      .spyOn(
        require('../incident-room/socket-registry') as {
          getIncidentSocketServer: () => unknown;
        },
        'getIncidentSocketServer',
      )
      .mockReturnValue({ emit });

    gateway.emitCreated(notification as never);

    expect(emit).toHaveBeenCalledWith('notification.created', notification);
  });
});
