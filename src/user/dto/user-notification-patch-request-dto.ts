import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const UserNotificationPatchRequestSchema = z.object({
  notificationToken: z
    .string({ error: 'notificationToken should be a string' })
    .optional()
    .default(''),
});

export class UserNotificationPatchRequestDto extends createZodDto(
  UserNotificationPatchRequestSchema
) {}
