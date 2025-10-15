import { Injectable } from '@nestjs/common';
import { Access, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/shared/prisma.service';
import { S3Service } from 'src/shared/s3.service';

type DeviceAccesses = Prisma.AccessGetPayload<{
  select: {
    id: true;
    accessLevel: true;
    user: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  async checkIfUserHasAccess(
    userId: string,
    deviceId: string
  ): Promise<Access | null> {
    const access = await this.prisma.access.findFirst({
      where: {
        userId,
        deviceSerialNumber: deviceId,
      },
    });

    return access;
  }

  async getDeviceThumbnail(deviceId: string) {
    return await this.s3.getPresignedUrl(`thumbnails/${deviceId}.jpg`);
  }

  async updateDeviceNickname(
    accessId: string,
    nickname: string
  ): Promise<Access> {
    return await this.prisma.access.update({
      where: { id: accessId },
      data: { nickname },
    });
  }

  async getDeviceAccesses(deviceId: string): Promise<DeviceAccesses[]> {
    return await this.prisma.access.findMany({
      where: { deviceSerialNumber: deviceId },
      select: {
        id: true,
        accessLevel: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
