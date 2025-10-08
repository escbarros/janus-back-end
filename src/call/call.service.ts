import { Injectable } from '@nestjs/common';
import { Call, CallStatus } from 'generated/prisma';
import { PrismaService } from 'src/shared/prisma.service';
import { MqttService } from 'src/shared/mqtt.service';
import { S3Service } from 'src/shared/s3.service';

@Injectable()
export class CallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqtt: MqttService,
    private readonly s3: S3Service
  ) {}

  async checkIfUserHasAccessToDevice(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    const device = await this.prisma.device.findFirst({
      where: { serialNumber: deviceId, accesses: { some: { userId } } },
    });
    return !!device;
  }

  async checkIfThereIsAnActiveCall(deviceId: string): Promise<string | null> {
    const activeCall = await this.prisma.call.findFirst({
      where: { deviceSerialNumber: deviceId, status: CallStatus.ACTIVE },
    });
    return activeCall?.id || null;
  }

  async startCall(deviceId: string) {
    const newCall = await this.prisma.call.create({
      data: { deviceSerialNumber: deviceId },
    });

    this.mqtt.publish(`device/status/${deviceId}/call`, {
      event: 'START',
      callId: newCall.id,
      deviceId,
      startedAt: newCall.startedAt,
    });

    return newCall;
  }

  async stopCall(callId: string) {
    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.FINISHED, endedAt: new Date() },
    });

    this.mqtt.publish(`device/status/${updatedCall.deviceSerialNumber}/call`, {
      event: 'STOP',
      callId: updatedCall.id,
      deviceId: updatedCall.deviceSerialNumber,
      endedAt: updatedCall.endedAt,
    });

    return updatedCall;
  }

  async getDeviceCalls(deviceId: string) {
    const calls = await this.prisma.call.findMany({
      where: {
        deviceSerialNumber: deviceId,
      },
      include: {
        messages: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return calls;
  }

  async getCallInfo(userId: string, callId: string): Promise<Call | null> {
    return await this.prisma.call.findFirst({
      where: {
        id: callId,
        device: {
          accesses: {
            some: {
              userId: userId,
            },
          },
        },
      },
      include: {
        messages: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async getCallVideo(callId: string): Promise<string> {
    const recordingKey = `recordings/${callId}.mp4`;
    const videoUrl = await this.s3.getPresignedUrl(recordingKey);

    return videoUrl;
  }
}
