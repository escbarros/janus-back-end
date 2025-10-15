import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { DeviceService } from './device.service';
import { SwaggerDeviceThumbnailEndpoint } from './decorators/swagger-device-thumbnail-endpoint.decorator';
import { ChangeDeviceNicknameRequestDto } from './dto/change-device-nickname-request-dto';
import { ClerkHttpService } from 'src/shared/clerk-http.service';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@UseGuards(ClerkJwtAuthGuard)
@Controller('device')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly clerkHttpService: ClerkHttpService
  ) {}

  @SwaggerDeviceThumbnailEndpoint()
  @Get('/thumbnail/:deviceId')
  async getDeviceThumbnail(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string
  ) {
    const userId = request.userId;
    const hasAccess = await this.deviceService.checkIfUserHasAccess(
      userId,
      deviceId
    );
    if (!hasAccess) {
      throw new ForbiddenException('User does not have access to this device');
    }

    const url = await this.deviceService.getDeviceThumbnail(deviceId);

    return { url };
  }

  @Patch('/nickname/:deviceId')
  async updateDeviceNickname(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string,
    @Body() body: ChangeDeviceNicknameRequestDto
  ) {
    const userId = request.userId;
    const { nickname } = body;
    const access = await this.deviceService.checkIfUserHasAccess(
      userId,
      deviceId
    );
    if (access === null) {
      throw new ForbiddenException('User does not have access to this device');
    }

    const updatedAccess = await this.deviceService.updateDeviceNickname(
      access.id,
      nickname
    );

    return updatedAccess;
  }

  @Get('/access/:deviceId')
  async getDeviceAccess(
    @Request() request: JwtRequestDto,
    @Param('deviceId') deviceId: string
  ) {
    const userId = request.userId;
    const access = await this.deviceService.checkIfUserHasAccess(
      userId,
      deviceId
    );
    if (access === null) {
      throw new ForbiddenException('User does not have access to this device');
    }

    const accesses = await this.deviceService.getDeviceAccesses(deviceId);

    await Promise.all(
      accesses.map(async access => {
        const userProfilePic = await this.clerkHttpService.getUserProfileImage(
          access.user.id
        );
        (
          access.user as {
            name: string;
            id: string;
            profilePic?: string | null;
          }
        ).profilePic = userProfilePic;
      })
    );

    return accesses;
  }
}
