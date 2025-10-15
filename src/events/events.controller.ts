import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { EventsService } from './events.service';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';
import { SwaggerEventThumbnailEndpoint } from './decorators/swagger-event-thumbnail-endpoint.decorator';
import { SwaggerEventReadEndpoint } from './decorators/swagger-event-read-endpoint.decorator';
import { EventDoorbellRequestDto } from './dto/event-doorbell-request-dto';
import { DeviceHeaderRequestDto } from 'src/shared/dto/device-header-request-dto';
import { EvenLockedUnlockedRequestDto } from './dto/event-locked-unlocked-request-dto';
import { ClerkHttpService } from 'src/shared/clerk-http.service';
import { NOTIFICATION_SERVICE } from 'src/shared/constants/services';
import { ClientProxy } from '@nestjs/microservices';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventService: EventsService,
    private readonly clerkHttpService: ClerkHttpService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(ClerkJwtAuthGuard)
  @SwaggerEventThumbnailEndpoint()
  @Get('/thumbnail/:eventId')
  async getEventThumbnail(
    @Request() request: JwtRequestDto,
    @Param('eventId') eventId: string
  ) {
    const { userId } = request;
    const hasAccess = await this.eventService.checkIfUserHasAccess(
      userId,
      eventId
    );
    if (!hasAccess) {
      throw new ForbiddenException('User do not have access to this event');
    }

    const url = await this.eventService.getEventThumbnail(eventId);
    return { url };
  }

  @ApiBearerAuth('JWT-auth')
  @SwaggerEventReadEndpoint()
  // @UseGuards(ClerkJwtAuthGuard)
  @Patch('/:eventId/read')
  async markEventAsRead(
    @Request() request: JwtRequestDto,
    @Param('eventId') eventId: string
  ) {
    const { userId } = request;
    const hasAccess = await this.eventService.checkIfUserHasAccess(
      userId,
      eventId
    );
    if (!hasAccess) {
      throw new ForbiddenException('User do not have access to this event');
    }

    await this.eventService.markEventAsRead(eventId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(ClerkJwtAuthGuard)
  @Get('/user')
  async getUserEvents(@Request() request: JwtRequestDto) {
    const { userId } = request;
    const events = await this.eventService.getUserEvents(userId);
    const uniqueUserIds = [
      ...new Set(events.map(e => e.userId).filter(Boolean)),
    ];

    const userEntries = await Promise.all(
      uniqueUserIds.map(
        async (
          id: string
        ): Promise<
          [string, { id: string; name: string | null; picUrl: string | null }]
        > => {
          const [picUrl, userInfo] = await Promise.all([
            this.clerkHttpService.getUserProfileImage(id),
            this.eventService.getUser(id),
          ]);
          return [id, { id, name: userInfo?.name ?? null, picUrl }];
        }
      )
    );

    const userMap = new Map(userEntries);

    return events.map(event => ({
      ...event,
      user: event.userId ? (userMap.get(event.userId) ?? null) : null,
    }));
  }

  @Post('/doorbell')
  async handleDoorbellEvent(
    @Headers() headers: DeviceHeaderRequestDto,
    @Body() body: EventDoorbellRequestDto
  ) {
    const {
      'x-device-id': deviceId,
      'x-timestamp': timestamp,
      'x-signature': signature,
    } = headers;
    const { deviceSerialNumber } = body;
    const device =
      await this.eventService.checkIfDeviceExists(deviceSerialNumber);

    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    const { publicKey } = device;

    const isVerified = this.eventService.verifyRequestSignature(
      deviceId,
      timestamp,
      signature,
      publicKey,
      'POST',
      '/events/doorbell'
    );

    if (!isVerified) {
      throw new ForbiddenException('Invalid request signature');
    }

    const event =
      await this.eventService.handleDoorbellEvent(deviceSerialNumber);

    if (device.accesses.length > 0) {
      this.notificationClient.emit('send_doorbell_notification', {
        eventId: event.id,
        accesses: device.accesses,
      });
    }

    return event;
  }

  @Post('/locked')
  async handleLockedEvent(
    @Headers() headers: DeviceHeaderRequestDto,
    @Body() body: EvenLockedUnlockedRequestDto
  ) {
    const {
      'x-device-id': deviceId,
      'x-timestamp': timestamp,
      'x-signature': signature,
    } = headers;

    const { userId } = body;

    const device = await this.eventService.checkIfDeviceExists(deviceId);

    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    const user = await this.eventService.checkIfUserExists(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { publicKey } = device;

    const isVerified = this.eventService.verifyRequestSignature(
      deviceId,
      timestamp,
      signature,
      publicKey,
      'POST',
      '/events/locked'
    );

    if (!isVerified) {
      throw new ForbiddenException('Invalid request signature');
    }

    const event = await this.eventService.handleLockedEvent(deviceId, userId);
    console.log(device.accesses);

    device.accesses = device.accesses.filter(
      a => a.user.notificationToken !== user.notificationToken
    );
    console.log(device.accesses);
    if (device.accesses.length > 0) {
      this.notificationClient.emit('send_lock_notification', {
        eventId: event.id,
        accesses: device.accesses,
        username: user.name.split(' ')[0],
      });
    }
    return event;
  }

  @Post('/unlocked')
  async handleUnlockedEvent(
    @Headers() headers: DeviceHeaderRequestDto,
    @Body() body: EvenLockedUnlockedRequestDto
  ) {
    const {
      'x-device-id': deviceId,
      'x-timestamp': timestamp,
      'x-signature': signature,
    } = headers;

    const { userId } = body;

    const device = await this.eventService.checkIfDeviceExists(deviceId);

    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    const user = await this.eventService.checkIfUserExists(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { publicKey } = device;

    const isVerified = this.eventService.verifyRequestSignature(
      deviceId,
      timestamp,
      signature,
      publicKey,
      'POST',
      '/events/unlocked'
    );

    if (!isVerified) {
      throw new ForbiddenException('Invalid request signature');
    }

    const event = await this.eventService.handleUnlockedEvent(deviceId, userId);
    console.log(device.accesses);

    device.accesses = device.accesses.filter(
      a => a.user.notificationToken !== user.notificationToken
    );
    if (device.accesses.length > 0) {
      this.notificationClient.emit('send_unlock_notification', {
        eventId: event.id,
        accesses: device.accesses,
        username: user.name.split(' ')[0],
      });
    }
    return event;
  }
}
