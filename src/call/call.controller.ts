import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CallService } from './call.service';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';

@ApiTags('Calls')
@UseGuards(ClerkJwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('call')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('/:deviceId/start')
  async startCall(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string
  ) {
    const { userId } = request;
    const hasAccess = await this.callService.checkIfUserHasAccessToDevice(
      userId,
      deviceId
    );
    if (!hasAccess) {
      throw new ForbiddenException('User do not have access to this device');
    }

    const activeCall =
      await this.callService.checkIfThereIsAnActiveCall(deviceId);
    if (activeCall != null) {
      throw new ForbiddenException('There is already an active call');
    }

    const newCall = await this.callService.startCall(deviceId);

    return newCall;
  }

  @Post('/:deviceId/stop')
  async stopCall(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string
  ) {
    const { userId } = request;
    const hasAccess = await this.callService.checkIfUserHasAccessToDevice(
      userId,
      deviceId
    );
    if (!hasAccess) {
      throw new ForbiddenException('User do not have access to this device');
    }

    const activeCall =
      await this.callService.checkIfThereIsAnActiveCall(deviceId);
    if (activeCall == null) {
      throw new ForbiddenException('There is no active call');
    }

    return await this.callService.stopCall(activeCall);
  }

  @Get('/device/:deviceId')
  async getDeviceCalls(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string
  ) {
    const { userId } = request;
    const hasAccess = await this.callService.checkIfUserHasAccessToDevice(
      userId,
      deviceId
    );

    if (!hasAccess) {
      throw new ForbiddenException('User does not have access to device');
    }

    const calls = await this.callService.getDeviceCalls(deviceId);
    return calls;
  }

  @Get('/:callId')
  async getCallDetails(
    @Request() request: JwtRequestDto,
    @Param('callId') callId: string
  ) {
    const { userId } = request;
    const info = await this.callService.getCallInfo(userId, callId);
    if (info == null) {
      throw new NotFoundException(
        'Call does not exist or user don`t have access'
      );
    }

    const videoUrl = await this.callService.getCallVideo(info.id);
    return { ...info, videoUrl };
  }
}
