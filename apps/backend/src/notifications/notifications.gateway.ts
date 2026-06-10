import { Injectable } from '@nestjs/common';
import { getIncidentSocketServer } from '../incident-room/socket-registry';
import type { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsGateway {
  emitCreated(notification: NotificationResponseDto): void {
    getIncidentSocketServer()?.emit('notification.created', notification);
  }
}
