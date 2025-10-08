import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from './constants/services';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NOTIFICATION_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notifications',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
