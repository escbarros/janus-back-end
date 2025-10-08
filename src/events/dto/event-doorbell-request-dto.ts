import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const EventDoorbellRequestSchema = z.object({
  deviceSerialNumber: z.string({
    error: issue =>
      issue.input == undefined
        ? 'deviceSerialNumber is required'
        : 'deviceSerialNumber must be a string',
  }),
});

export class EventDoorbellRequestDto extends createZodDto(
  EventDoorbellRequestSchema
) {}
