import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const WebhookUserRequestSchema = z.object({
  data: z.object({
    id: z.string({
      error: issue =>
        issue.input == undefined ? 'id is required' : 'id must be a string',
    }),
    email_addresses: z
      .array(
        z.object({
          email_address: z.email('invalid email'),
        })
      )
      .nonempty('email_addresses must have at least one email'),
    first_name: z.string({
      error: issue =>
        issue.input == undefined
          ? 'first_name is required'
          : 'first_name must be a string',
    }),
  }),
});

export class UserWebhookObject {
  id: string;
  email: string;
  first_name: string;
}

export class WebhookUserRequestDto extends createZodDto(
  WebhookUserRequestSchema
) {}
