import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway()
export class IncidentRoomGateway {
  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!';
  }
}
