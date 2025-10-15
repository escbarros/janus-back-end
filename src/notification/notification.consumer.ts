import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { UserService } from 'src/user/user.service';
import { ClerkHttpService } from 'src/shared/clerk-http.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export interface InviteSentNotificationPayload {
  token: string;
  deviceName: string;
  inviteId: string;
  senderId: string;
}
interface InviteAcceptedNotificationPayload {
  deviceName: string;
  senderId: string;
  receiverId: string;
}

interface DoorbellNotificationPayload {
  eventId: string;
  accesses: {
    nickname: string;
    user: {
      notificationToken: string | null;
    };
  }[];
}

interface DoorLockedNotificationPayload {
  eventId: string;
  username: string;
  accesses: {
    nickname: string;
    user: {
      notificationToken: string | null;
    };
  }[];
}

@Controller()
export class NotificationsConsumer {
  constructor(
    private readonly notificationsService: NotificationService,
    private readonly userService: UserService,
    private readonly clerkHttpService: ClerkHttpService
  ) {}

  @EventPattern('send_doorbell_notification')
  async handleDoorbellNotification(
    @Payload() data: DoorbellNotificationPayload
  ) {
    const { eventId, accesses } = data;

    const messages: ExpoPushMessage[] = accesses
      .filter(
        a =>
          a.user.notificationToken &&
          Expo.isExpoPushToken(a.user.notificationToken)
      )
      .map(a => ({
        to: a.user.notificationToken!,
        sound: 'default',
        title: '🔔 Alguém tocou a campainha!',
        body: `O interfone ${a.nickname.toUpperCase()} detectou um toque.`,
        categoryId: 'doorbell',
        data: { eventId },
      }));

    await this.notificationsService.sendBatchNotification(messages);
  }

  @EventPattern('send_lock_notification')
  async handleLockNotification(@Payload() data: DoorLockedNotificationPayload) {
    const { eventId, accesses, username } = data;

    const messages: ExpoPushMessage[] = accesses
      .filter(
        a =>
          a.user.notificationToken &&
          Expo.isExpoPushToken(a.user.notificationToken)
      )
      .map(a => ({
        to: a.user.notificationToken!,
        sound: 'default',
        title: `🔒🚪 ${a.nickname.toUpperCase()} foi trancada! `,
        body: ` ${username} trancou ${a.nickname.toUpperCase()}.`,
        categoryId: 'locked',
        data: { eventId },
      }));

    await this.notificationsService.sendBatchNotification(messages);
  }

  @EventPattern('send_unlock_notification')
  async handleUnlockNotification(
    @Payload() data: DoorLockedNotificationPayload
  ) {
    const { eventId, accesses, username } = data;

    const messages: ExpoPushMessage[] = accesses
      .filter(
        a =>
          a.user.notificationToken &&
          Expo.isExpoPushToken(a.user.notificationToken)
      )
      .map(a => ({
        to: a.user.notificationToken!,
        sound: 'default',
        title: `🔓🚪 ${a.nickname.toUpperCase()} foi destrancada! `,
        body: ` ${username} destrancou ${a.nickname.toUpperCase()}.`,
        categoryId: 'unlocked',
        data: { eventId },
      }));

    await this.notificationsService.sendBatchNotification(messages);
  }

  @EventPattern('send_invite_notification')
  async handleNotification(@Payload() data: InviteSentNotificationPayload) {
    const { token, deviceName, senderId, inviteId } = data;
    const imageUrl = await this.clerkHttpService.getUserProfileImage(senderId);
    let username = '';
    try {
      const user = await this.userService.getUserById(senderId);
      username = user.name.split(' ')[0];
    } catch {
      console.log('failed to fetch sender info');
      username = 'Usuário';
    }

    const title = '📢🚪 Convite de acesso recebido!';

    const body = `👤 ${username} convidou você para acessar o interfone ${deviceName.toLocaleUpperCase()}`;
    await this.notificationsService.sendPushNotification(
      token,
      title,
      body,
      inviteId,
      imageUrl,
      'invite'
    );
  }

  @EventPattern('send_invite_accepted_notification')
  async handleAcceptedNotification(
    @Payload() data: InviteAcceptedNotificationPayload
  ) {
    const { deviceName, senderId, receiverId } = data;
    const imageUrl = await this.clerkHttpService.getUserProfileImage(senderId);
    let username = '';
    let token = '';
    try {
      const user = await this.userService.getUserById(senderId);
      username = user.name.split(' ')[0];
      token = (await this.userService.getUserPushToken(receiverId)) || '';
    } catch {
      console.log('failed to fetch sender info');
      username = 'Usuário';
      token = '';
    }

    const title = '✅ Convite aceito!';
    const body = `👤 ${username} aceitou seu convite para acessar o interfone ${deviceName.toUpperCase()}`;

    if (token == '') return;
    await this.notificationsService.sendPushNotification(
      token,
      title,
      body,
      undefined,
      imageUrl
    );
  }
}
