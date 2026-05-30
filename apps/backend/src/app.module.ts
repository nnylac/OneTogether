import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { MockController } from './mock.controller';
import { MockService } from './mock.service';

@Module({
  imports: [AiModule],
  controllers: [MockController],
  providers: [MockService],
})
export class AppModule {}
