import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiChatService } from './ai-chat.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AiChatService],
  exports: [AiService, AiChatService],
})
export class AiModule {}
