import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      //   accessToken: process.env.EXPO_ACCESS_TOKEN, // se você ativou Push Security
      useFcmV1: true,
    });
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    inviteId?: string,
    imageUrl?: string | null,
    category: string | undefined = 'default'
  ) {
    try {
      if (!Expo.isExpoPushToken(token)) {
        throw new Error(`Token inválido`);
      }

      const messages: ExpoPushMessage[] = [
        {
          to: token,
          sound: 'default',
          title,
          body,
          categoryId: category,
          data: {
            inviteId,
          },
          richContent:
            imageUrl != null
              ? {
                  image: imageUrl,
                }
              : {},
        },
      ];

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Erro ao enviar chunk:', error);
        }
      }

      return tickets;
    } catch (err) {
      console.error('Erro ao enviar notificação Expo:', err);
      throw new InternalServerErrorException('Falha ao enviar notificação');
    }
  }
}
