import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('incidents/:id/messages')
export class ChatController {
  constructor(private service: ChatService) {}

  @Get()
  getMessages(
    @Param('id') incidentId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMessages(incidentId, cursor, limit ? parseInt(limit) : 50);
  }
}
