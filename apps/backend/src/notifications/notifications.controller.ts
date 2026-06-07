import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  findAll(
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one notification by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: NotificationResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create one notification' })
  @ApiCreatedResponse({ type: NotificationResponseDto })
  create(@Body() dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.notificationsService.create(dto);
  }

  @Patch('recipients/:recipientId/read')
  @ApiOperation({ summary: 'Mark one notification recipient as read' })
  @ApiParam({ name: 'recipientId', format: 'uuid' })
  @ApiOkResponse({
    schema: {
      example: {
        id: '30000000-0000-0000-0000-000000000001',
        isRead: true,
        readAt: '2026-06-07T10:00:00.000Z',
      },
    },
  })
  markRecipientAsRead(
    @Param('recipientId', ParseUUIDPipe) recipientId: string,
  ): Promise<{ id: string; isRead: boolean; readAt: Date | null }> {
    return this.notificationsService.markRecipientAsRead(recipientId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all matching notification recipients as read',
  })
  @ApiOkResponse({ schema: { example: { count: 3 } } })
  markAllAsRead(
    @Body() dto: MarkNotificationsReadDto,
  ): Promise<{ count: number }> {
    return this.notificationsService.markAllAsRead(dto);
  }
}
