import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const ChangeDeviceNicknameRequestSchema = z.object({
  nickname: z.string({
    error: issue =>
      issue.input == undefined
        ? 'nickname is required'
        : 'nickname must be a string',
  }),
});

export class ChangeDeviceNicknameRequestDto extends createZodDto(
  ChangeDeviceNicknameRequestSchema
) {}
