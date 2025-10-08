import { ForbiddenException, Injectable } from '@nestjs/common';
import { Device, EventType, User } from 'generated/prisma';
import { PrismaService } from 'src/shared/prisma.service';
import { S3Service } from 'src/shared/s3.service';
import * as crypto from 'crypto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  async checkIfUserHasAccess(
    userId: string,
    eventId: string
  ): Promise<boolean> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        device: {
          accesses: {
            some: {
              userId: userId,
            },
          },
        },
      },
    });
    return !!event;
  }

  async getEventThumbnail(eventId: string) {
    return await this.s3.getPresignedUrl(`events/${eventId}.jpg`);
  }

  async markEventAsRead(eventId: string) {
    await this.prisma.event.update({
      where: { id: eventId },
      data: { readAt: new Date() },
    });
  }

  async getUserEvents(userId: string) {
    const accesses = await this.prisma.access.findMany({
      where: { userId },
      select: { deviceSerialNumber: true, nickname: true },
    });

    const nicknameMap = Object.fromEntries(
      accesses.map(a => [a.deviceSerialNumber, a.nickname])
    );

    const events = await this.prisma.event.findMany({
      where: {
        OR: [
          {
            device: {
              accesses: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          {
            invite: {
              receiver: {
                id: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        timestamp: true,
        userId: true,
        deviceSerialNumber: true,
        inviteId: true,
        type: true,
        readAt: true,
        device: {
          select: {
            name: true,
          },
        },
      },
    });

    return events.map(event => ({
      ...event,
      device: {
        serialNumber: event.deviceSerialNumber,
        nickname: nicknameMap[event.deviceSerialNumber] || event.device.name,
      },
    }));
  }

  async getUser(id: string): Promise<User | null> {
    return await this.prisma.user.findFirst({ where: { id } });
  }

  async checkIfDeviceExists(
    deviceSerialNumber: string
  ): Promise<Device | null> {
    const device = await this.prisma.device.findUnique({
      where: { serialNumber: deviceSerialNumber },
    });
    return device;
  }

  async handleDoorbellEvent(deviceSerialNumber: string) {
    const event = await this.prisma.event.create({
      data: {
        type: EventType.DOORBELL,
        deviceSerialNumber,
        userId: null,
      },
    });
    return event;
  }

  async handleLockedEvent(deviceId: string, userId: string | null) {
    const event = await this.prisma.event.create({
      data: {
        type: EventType.DOOR_LOCKED,
        deviceSerialNumber: deviceId,
        userId,
      },
    });
    return event;
  }

  async handleUnlockedEvent(deviceId: string, userId: string | null) {
    userId = userId != '' ? userId : null;
    const event = await this.prisma.event.create({
      data: {
        type: EventType.DOOR_UNLOCKED,
        deviceSerialNumber: deviceId,
        userId,
      },
    });
    return event;
  }

  async checkIfUserExists(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  }

  verifyRequestSignature(
    deviceId: string,
    timestamp: string,
    signature: string,
    publicKey: string,
    method: string,
    path: string
  ): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    const timeDifference = Math.abs(currentTime - requestTime);

    if (timeDifference > 30) {
      throw new ForbiddenException('Request timestamp is too old');
    }

    const keyContent = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
    const keyChunks = keyContent.match(/.{1,64}/g) || [];

    const formattedPublicKey = [
      '-----BEGIN PUBLIC KEY-----',
      ...keyChunks,
      '-----END PUBLIC KEY-----',
    ].join('\n');

    const publicKeyObject = crypto.createPublicKey(formattedPublicKey);
    const canonicalString = `${method} ${path} ${timestamp} ${deviceId}`;

    const serverHash = crypto
      .createHash('sha256')
      .update(canonicalString)
      .digest();

    const signatureBuffer = Buffer.from(signature, 'base64');
    const isVerified = crypto.verify(
      null,
      serverHash,
      {
        key: publicKeyObject,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
      },
      signatureBuffer
    );

    return isVerified;
  }
}
