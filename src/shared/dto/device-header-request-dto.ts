import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const DeviceHeaderRequestSchema = z.object({
  'x-device-id': z.string(),
  'x-timestamp': z.string(),
  'x-signature': z.string(),
});

export class DeviceHeaderRequestDto extends createZodDto(
  DeviceHeaderRequestSchema
) {}
