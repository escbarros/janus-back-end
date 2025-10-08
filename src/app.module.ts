import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';

import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { HttpExceptionFilter } from './filters/HttpExceptionFilter.filter';
import { PrismaModule } from './shared/prisma.module';
import { S3Module } from './shared/s3.module';
import { DeviceModule } from './device/device.module';
import { EventsModule } from './events/events.module';
import { CallModule } from './call/call.module';
import { MqttModule } from './shared/mqtt.module';
import { InviteModule } from './invite/invite.module';
import { ClerkHttpModule } from './shared/clerk-http.module';
import { NotificationService } from './notification/notification.service';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    S3Module,
    DeviceModule,
    EventsModule,
    CallModule,
    MqttModule,
    InviteModule,
    ClerkHttpModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    NotificationService,
  ],
})
export class AppModule {}
