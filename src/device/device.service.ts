import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
import { S3Service } from 'src/shared/s3.service';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  async checkIfUserHasAccess(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    const device = await this.prisma.access.findFirst({
      where: {
        userId,
        deviceSerialNumber: deviceId,
      },
    });

    return !!device;
  }

  async getDeviceThumbnail(deviceId: string) {
    return await this.s3.getPresignedUrl(`thumbnails/${deviceId}.jpg`);
  }
}
