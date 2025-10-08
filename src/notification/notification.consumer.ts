import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { UserService } from 'src/user/user.service';
import { ClerkHttpService } from 'src/shared/clerk-http.service';

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

@Controller()
export class NotificationsConsumer {
  constructor(
    private readonly notificationsService: NotificationService,
    private readonly userService: UserService,
    private readonly clerkHttpService: ClerkHttpService
  ) {}

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
