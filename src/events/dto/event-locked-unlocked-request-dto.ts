import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const EvenLockedUnlockedRequestSchema = z.object({
  userId: z.string().optional().default(''),
});

export class EvenLockedUnlockedRequestDto extends createZodDto(
  EvenLockedUnlockedRequestSchema
) {}
