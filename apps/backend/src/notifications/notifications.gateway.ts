import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { NotificationResponseDto } from './dto/notification-response.dto';

@WebSocketGateway()
export class NotificationsGateway {
  @WebSocketServer()
  private readonly server?: { emit: (event: string, payload: unknown) => void };

  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!';
  }

  emitCreated(notification: NotificationResponseDto): void {
    this.server?.emit('notification.created', notification);
  }
}
