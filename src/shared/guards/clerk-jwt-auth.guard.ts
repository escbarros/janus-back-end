/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import jwt, { JwtHeader } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config/env';

interface ClerkJWTPayload {
  sub: string;
  iss?: string;
  iat?: number;
  exp?: number;
  sid?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

const client = jwksClient({
  jwksUri:
    config.clerk.jwksUri || `${config.clerk.issuer}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
});

function getKey(header: JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!header.kid) return reject(new Error('No kid found in JWT header'));
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      const signingKey = key?.getPublicKey();
      if (!signingKey) return reject(new Error('Unable to get signing key'));
      resolve(signingKey);
    });
  });
}

@Injectable()
export class ClerkJwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token not provided or invalid format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const decodedHeader = jwt.decode(token, {
      complete: true,
    });
    if (
      !decodedHeader ||
      typeof decodedHeader !== 'object' ||
      !('header' in decodedHeader)
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const signingKey = await getKey(decodedHeader.header);

    let decoded: ClerkJWTPayload;
    try {
      decoded = jwt.verify(token, signingKey, {
        issuer: config.clerk.issuer,
        algorithms: ['RS256'],
      }) as ClerkJWTPayload;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid token'
      );
    }

    (request as any).userId = decoded.sub;

    return true;
  }
}
