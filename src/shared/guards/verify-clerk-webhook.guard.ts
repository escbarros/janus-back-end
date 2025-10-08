import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { config } from '../config/env';

@Injectable()
export class VerifyClerkWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const svixId = req.header('svix-id');
    const svixTimestamp = req.header('svix-timestamp');
    const svixSignature = req.header('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException({
        message: 'invalid token',
      });
    }

    const webhookSecret = config.clerk.webhookSigningSecret;
    if (!webhookSecret) {
      console.log(config.clerk.webhookSigningSecret);
      throw new InternalServerErrorException({
        error: 'Webhook secret not configured',
        message: 'CLERK_WEBHOOK_SECRET environment variable is required',
      });
    }

    const body = JSON.stringify(req.body);

    const timestamp = parseInt(svixTimestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timestampTolerance = 5 * 60; // 5 minutes

    if (Math.abs(currentTime - timestamp) > timestampTolerance) {
      throw new BadRequestException({
        message: 'Request timestamp is too old or too far in the future',
      });
    }

    const signedContent = `${svixId}.${svixTimestamp}.${body}`;
    const secretKey = webhookSecret.startsWith('whsec_')
      ? webhookSecret.slice(6)
      : webhookSecret;
    const secretBytes = Buffer.from(secretKey, 'base64');

    const expectedSignature = createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const signatures = svixSignature.split(' ').map(sig => {
      const [version, signature] = sig.split(',');
      return { version, signature };
    });

    let isValidSignature = false;
    for (const { version, signature } of signatures) {
      if (version === 'v1' && signature) {
        const expectedBuffer = Buffer.from(expectedSignature);
        const receivedBuffer = Buffer.from(signature);

        if (
          expectedBuffer.length === receivedBuffer.length &&
          timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
          isValidSignature = true;
          break;
        }
      }
    }

    if (!isValidSignature) {
      throw new BadRequestException({
        error: 'Signature verification failed',
        message: 'Webhook signature is invalid',
      });
    }

    return true;
  }
}
