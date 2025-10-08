import { Injectable } from '@nestjs/common';
import {
  AccessLevel,
  Device,
  EventType,
  Invite,
  Prisma,
  User,
} from 'generated/prisma';
import { PrismaService } from 'src/shared/prisma.service';

type UserDeviceAccess = Prisma.DeviceGetPayload<{
  select: {
    serialNumber: true;
    accesses: {
      select: { nickname: true };
    };
  };
}>;

type GetInvite = Prisma.InviteGetPayload<{
  select: {
    sender: {
      select: {
        id: true;
        name: true;
      };
    };
    revoked: {
      select: {
        id: true;
        name: true;
      };
    };
    receiver: {
      select: {
        id: true;
        name: true;
      };
    };
    accessLevel: true;
    device: {
      select: {
        serialNumber: true;
      };
    };
  };
}>;

@Injectable()
export class InviteService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvite(id: string, userId: string): Promise<GetInvite | null> {
    return await this.prisma.invite.findFirst({
      where: {
        id,
        OR: [
          {
            device: {
              accesses: {
                some: {
                  userId,
                },
              },
            },
          },
          {
            receiverId: userId,
          },
        ],
      },
      select: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        revoked: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
        accessLevel: true,
        device: {
          select: {
            serialNumber: true,
          },
        },
      },
    });
  }

  async getDeviceIfExists(serialNumber: string): Promise<Device | null> {
    const device = await this.prisma.device.findFirst({
      where: {
        serialNumber,
      },
    });

    return device;
  }

  async checkIfUserHasAccessToDevice(
    userId: string,
    serialNumber: string
  ): Promise<UserDeviceAccess | null> {
    const device = await this.prisma.device.findFirst({
      where: {
        serialNumber,
        accesses: {
          some: {
            userId,
          },
        },
      },
      select: {
        serialNumber: true,
        accesses: {
          where: {
            userId,
          },
          select: {
            nickname: true,
          },
        },
      },
    });

    return device;
  }

  async checkIfRecipientExists(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    return user;
  }

  async getPendingInvite(
    userId: string,
    serialNumber: string
  ): Promise<Invite | null> {
    const invite = await this.prisma.invite.findFirst({
      where: {
        receiverId: userId,
        deviceSerialNumber: serialNumber,
        status: 'PENDING',
      },
    });

    return invite;
  }
  async getPendingInviteById(
    id: string,
    userId: string
  ): Promise<Invite | null> {
    console.log({ id, userId });
    const invite = await this.prisma.invite.findFirst({
      where: {
        id,
        status: 'PENDING',
      },
    });

    if (!invite || invite.receiverId != userId) {
      return null;
    }

    return invite;
  }

  async createInvite(
    senderId: string,
    receiverId: string,
    serialNumber: string,
    accessLevel: AccessLevel
  ) {
    return this.prisma.$transaction(async tx => {
      const invite = await tx.invite.create({
        data: {
          senderId,
          receiverId,
          deviceSerialNumber: serialNumber,
          accessLevel,
          status: 'PENDING',
        },
      });

      await tx.event.create({
        data: {
          userId: senderId,
          deviceSerialNumber: serialNumber,
          inviteId: invite.id,
          type: EventType.INVITE_SENT,
        },
      });

      return invite;
    });
  }

  async acceptInvite(
    invite: Invite,
    userId: string,
    nickname: string
  ): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.access.create({
        data: {
          deviceSerialNumber: invite.deviceSerialNumber,
          nickname,
          accessLevel: invite.accessLevel,
          userId: userId,
        },
      });
      await tx.event.create({
        data: {
          deviceSerialNumber: invite.deviceSerialNumber,
          type: 'INVITE_ACCEPTED',
          userId: invite.receiverId,
        },
      });
    });
  }

  async rejectInvite(id: string): Promise<void> {
    await this.prisma.invite.delete({ where: { id } });
  }

  async expireInvite(id: string): Promise<void> {
    await this.prisma.invite.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }
}
