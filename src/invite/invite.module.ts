import { Module } from '@nestjs/common';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import { PrismaService } from 'src/shared/prisma.service';
import { RabbitMQModule } from 'src/shared/RabbitMQModule.module';

@Module({
  imports: [RabbitMQModule],
  controllers: [InviteController],
  providers: [InviteService, PrismaService],
  exports: [InviteService],
})
export class InviteModule {}
