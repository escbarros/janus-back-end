import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserWebhookObject } from './dto/user-webhook-request-dto';
import { PrismaService } from '../shared/prisma.service';
import { Prisma, User } from 'generated/prisma';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser({ id, first_name: name, email }: UserWebhookObject) {
    try {
      await this.prisma.user.create({
        data: { id, name, email },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserPushToken(id: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { id },
      select: { notificationToken: true },
    });

    if (!user) return null;

    return user.notificationToken;
  }

  async getUserAccesses(userId: string): Promise<any[]> {
    const accesses = await this.prisma.access.findMany({
      where: { userId },
    });
    return accesses.map(({ deviceSerialNumber, ...rest }) => ({
      ...rest,
      serialNumber: deviceSerialNumber,
    }));
  }

  async getUserEvents(userId: string): Promise<any[]> {
    const accesses = await this.prisma.access.findMany({
      where: { userId },
      select: { deviceSerialNumber: true },
    });

    const deviceSerialNumbers = accesses.map(a => a.deviceSerialNumber);

    if (deviceSerialNumbers.length === 0) return [];

    const events = await this.prisma.event.findMany({
      where: {
        deviceSerialNumber: { in: deviceSerialNumbers },
      },
    });

    return events.map(({ deviceSerialNumber, ...rest }) => ({
      ...rest,
      serialNumber: deviceSerialNumber,
    }));
  }

  async updateUserNotificationToken(id: string, notificationToken: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        notificationToken,
      },
    });
  }

  async removeUserNotificationToken(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        notificationToken: null,
      },
    });
  }
}
