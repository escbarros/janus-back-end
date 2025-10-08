import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { DeviceService } from './device.service';
import { SwaggerDeviceThumbnailEndpoint } from './decorators/swagger-device-thumbnail-endpoint.decorator';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@UseGuards(ClerkJwtAuthGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

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
}
