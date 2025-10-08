import { Module, Global } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { TranscriptionListener } from './transcription.listener';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [MqttService, TranscriptionListener, PrismaService],
  exports: [MqttService],
})
export class MqttModule {}
