import { Injectable, OnModuleInit } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaService } from 'src/shared/prisma.service';
import { MessageOrigin } from 'generated/prisma';

@Injectable()
export class TranscriptionListener implements OnModuleInit {
  constructor(
    private readonly mqtt: MqttService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit() {
    this.mqtt.subscribe(
      'call/+/stt',
      (topic: string, payload: { text?: string }) => {
        const [, callId] = topic.split('/');
        const text: string | undefined = payload?.text;

        if (text) {
          this.prisma.message
            .create({
              data: {
                callId,
                text,
                origin: MessageOrigin.DEVICE,
              },
            })
            .catch(err => {
              console.error(`Erro ao salvar transcrição [${callId}]:`, err);
            });
        }
      }
    );

    this.mqtt.subscribe(
      'device/status/+/+/tts',
      (topic: string, payload: { message?: string }) => {
        const callId = topic.split('/')[3];
        const text: string | undefined = payload?.message;

        if (text) {
          this.prisma.message
            .create({
              data: {
                callId,
                text,
                origin: MessageOrigin.USER,
              },
            })
            .catch(err => {
              console.error(`Erro ao salvar TTS [${callId}]:`, err);
            });
        }
      }
    );
  }
}
