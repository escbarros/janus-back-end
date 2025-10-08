import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';

type MessageHandler = (topic: string, payload: any) => void;

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient;
  private handlers: { [topic: string]: MessageHandler[] } = {};

  onModuleInit() {
    this.client = connect(
      'mqtts://fa14e40249354fa380420881ee6bc48a.s1.eu.hivemq.cloud:8883',
      {
        username: 'usuario',
        password: 'Senha@123',
      }
    );

    this.client.on('connect', () => {
      console.log('✅ MQTT conectado');
    });

    this.client.on('message', (topic, payloadBuf) => {
      const payloadStr = payloadBuf.toString();
      let payload: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        payload = JSON.parse(payloadStr);
      } catch {
        payload = payloadStr;
      }

      for (const [filter, handlers] of Object.entries(this.handlers)) {
        if (this.topicMatches(filter, topic)) {
          handlers.forEach(h => h(topic, payload));
        }
      }
    });

    this.client.on('error', err => {
      console.error('❌ Erro MQTT:', err);
    });
  }

  publish(topic: string, message: any) {
    const payload =
      typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload, { qos: 1 });
  }

  subscribe(topicFilter: string, handler: MessageHandler) {
    this.client.subscribe(topicFilter);
    if (!this.handlers[topicFilter]) {
      this.handlers[topicFilter] = [];
    }
    this.handlers[topicFilter].push(handler);
  }

  private topicMatches(filter: string, topic: string): boolean {
    const filterLevels = filter.split('/');
    const topicLevels = topic.split('/');

    for (let i = 0; i < filterLevels.length; i++) {
      if (filterLevels[i] === '#') return true;
      if (filterLevels[i] === '+') continue;
      if (filterLevels[i] !== topicLevels[i]) return false;
    }

    return filterLevels.length === topicLevels.length;
  }

  onModuleDestroy() {
    this.client.end();
  }
}
