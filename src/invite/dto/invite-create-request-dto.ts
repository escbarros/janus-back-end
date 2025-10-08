import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const InviteCreateRequestSchema = z.object({
  deviceId: z.string({
    error: issue =>
      issue.input == undefined
        ? 'deviceId is required'
        : 'deviceId must be a string',
  }),
  recipientEmail: z.email({ error: 'invalid email' }),
  accessLevel: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

export class InviteCreateRequestDto extends createZodDto(
  InviteCreateRequestSchema
) {}
