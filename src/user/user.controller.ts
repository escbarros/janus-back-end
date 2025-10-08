import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { SwaggerWebhookEndpoint } from './decorators/swagger-webhook-endpoint.decorator';
import { WebhookUserRequestDto } from './dto/user-webhook-request-dto';
import { VerifyClerkWebhookGuard } from 'src/shared/guards/verify-clerk-webhook.guard';
import { ClerkJwtAuthGuard } from 'src/shared/guards/clerk-jwt-auth.guard';
import { SwaggerAuthEndpoint } from './decorators/swagger-auth-endpoint.decorator';
import { JwtRequestDto } from 'src/shared/dto/jwt-request-dto';
import { UserNotificationPatchRequestDto } from './dto/user-notification-patch-request-dto';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/webhook')
  @SwaggerWebhookEndpoint()
  @UseGuards(VerifyClerkWebhookGuard)
  async createUser(@Body() body: WebhookUserRequestDto) {
    const { id, email_addresses, first_name } = body.data;
    const email = email_addresses[0].email_address;
    await this.userService.createUser({
      id,
      email,
      first_name,
    });
  }

  @Get('/auth')
  @SwaggerAuthEndpoint()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(ClerkJwtAuthGuard)
  async authUser(@Request() request: JwtRequestDto) {
    const { id, name, email } = await this.userService.getUserById(
      request.userId
    );
    const devices = await this.userService.getUserAccesses(request.userId);
    const events = await this.userService.getUserEvents(request.userId);
    return { id, name, email, devices, events };
  }

  @Patch('/add-notification')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(ClerkJwtAuthGuard)
  async patchUserNotificationToken(
    @Request() request: JwtRequestDto,
    @Body() body: UserNotificationPatchRequestDto
  ) {
    const { userId } = request;
    const { notificationToken } = body;
    if (notificationToken == '') return;

    await this.userService.updateUserNotificationToken(
      userId,
      notificationToken
    );
  }

  @Patch('/remove-notification')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(ClerkJwtAuthGuard)
  async patchUserRemoveNotificationToken(@Request() request: JwtRequestDto) {
    const { userId } = request;
    await this.userService.removeUserNotificationToken(userId);
  }
}
