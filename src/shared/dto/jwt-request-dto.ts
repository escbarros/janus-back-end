import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const JwtRequestSchema = z.object({
  userId: z.string(),
});

export class JwtRequestDto extends createZodDto(JwtRequestSchema) {}
