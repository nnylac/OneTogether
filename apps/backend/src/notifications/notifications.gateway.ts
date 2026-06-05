import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class NotificationsGateway {
  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!';
  }
}
