import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationsConsumer } from './notification.consumer';
import { UserService } from 'src/user/user.service';
import { ClerkHttpService } from 'src/shared/clerk-http.service';

@Global()
@Module({
  providers: [NotificationService, UserService, ClerkHttpService],
  controllers: [NotificationsConsumer],
  exports: [NotificationService],
})
export class NotificationModule {}
