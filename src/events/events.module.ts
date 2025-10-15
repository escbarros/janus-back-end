import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { RabbitMQModule } from 'src/shared/RabbitMQModule.module';

@Module({
  imports: [RabbitMQModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
