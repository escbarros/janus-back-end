import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
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

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventService: EventsService,
    private readonly clerkHttpService: ClerkHttpService
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
    return event;
  }
}
