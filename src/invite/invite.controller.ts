import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { InviteService } from './invite.service';
import { InviteCreateRequestDto } from './dto/invite-create-request-dto';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from 'src/shared/constants/services';

@ApiTags('Invite')
@UseGuards(ClerkJwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('invite')
export class InviteController {
  constructor(
    private readonly inviteService: InviteService,

    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy
  ) {}

  @Get('/:inviteId')
  async getInvite(
    @Request() request: JwtRequestDto,
    @Param('inviteId') inviteId: string
  ) {
    const { userId } = request;

    const invite = await this.inviteService.getInvite(inviteId, userId);

    if (!invite) {
      throw new NotFoundException('cant find invite');
    }

    return invite;
  }

  @Post('/send')
  async createInvite(
    @Request() request: JwtRequestDto,
    @Body() body: InviteCreateRequestDto
  ) {
    const { userId } = request;
    const { deviceId, recipientEmail, accessLevel } = body;

    const recipient =
      await this.inviteService.checkIfRecipientExists(recipientEmail);

    if (recipient == null) {
      throw new NotFoundException('recipient not found');
    }

    const device = await this.inviteService.getDeviceIfExists(deviceId);

    if (device == null) {
      throw new NotFoundException('device not found');
    }

    const userAccess = await this.inviteService.checkIfUserHasAccessToDevice(
      userId,
      deviceId
    );

    if (userAccess == null) {
      throw new ForbiddenException('user does not have access to device');
    }

    const recipientAccess =
      await this.inviteService.checkIfUserHasAccessToDevice(
        recipient.id,
        deviceId
      );

    if (recipientAccess != null) {
      throw new ForbiddenException('recipient already has access to device');
    }

    const pendingInvite = await this.inviteService.getPendingInvite(
      recipient.id,
      deviceId
    );

    if (pendingInvite != null) {
      await this.inviteService.expireInvite(pendingInvite.id);
    }

    const invite = await this.inviteService.createInvite(
      userId,
      recipient.id,
      deviceId,
      accessLevel
    );

    if (recipient.notificationToken != null) {
      this.notificationClient.emit('send_invite_notification', {
        token: recipient.notificationToken,
        inviteId: invite.id,
        senderId: userId,
        deviceName: userAccess.accesses[0].nickname,
      });
    }

    return invite;
  }

  @Post('/:inviteId/accept')
  async acceptInvite(
    @Request() request: JwtRequestDto,
    @Param('inviteId') inviteId: string
  ) {
    const { userId } = request;

    const invite = await this.inviteService.getPendingInviteById(
      inviteId,
      userId
    );
    if (invite == null) {
      throw new NotFoundException('invite not found');
    }
    const recipientAccess =
      await this.inviteService.checkIfUserHasAccessToDevice(
        userId,
        invite.deviceSerialNumber
      );

    if (recipientAccess != null) {
      throw new ForbiddenException('user already has access to device');
    }

    const senderAccess = await this.inviteService.checkIfUserHasAccessToDevice(
      invite.senderId,
      invite.deviceSerialNumber
    );

    if (senderAccess == null) {
      throw new ForbiddenException(
        'the user who sent this invite no longer has access to it'
      );
    }

    const senderNickname = senderAccess.accesses[0].nickname;

    await this.inviteService.acceptInvite(invite, userId, senderNickname);

    this.notificationClient.emit('send_invite_accepted_notification', {
      senderId: userId,
      deviceName: senderNickname,
      receiverId: invite.senderId,
    });
  }

  @Post('/:inviteId/reject')
  async rejectInvite(
    @Request() request: JwtRequestDto,
    @Param('inviteId') inviteId: string
  ) {
    const { userId } = request;

    const invite = await this.inviteService.getPendingInviteById(
      inviteId,
      userId
    );
    if (invite == null) {
      throw new NotFoundException('invite not found');
    }

    const recipientAccess =
      await this.inviteService.checkIfUserHasAccessToDevice(
        userId,
        invite.deviceSerialNumber
      );

    if (recipientAccess != null) {
      throw new ForbiddenException('user already has access to device');
    }

    await this.inviteService.rejectInvite(inviteId);
  }
}
