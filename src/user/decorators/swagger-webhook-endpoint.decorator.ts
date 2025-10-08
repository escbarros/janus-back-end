import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';

class EmailAddressDto {
  @ApiProperty({ example: 'john@example.com' })
  email_address: string;
}

class WebhookUserDataDto {
  @ApiProperty({ example: 'user_2g7np7Hrk0SN6kj5EDMLDaKNL0S' })
  id: string;

  @ApiProperty({
    type: [EmailAddressDto],
    example: [{ email_address: 'john@example.com' }],
  })
  email_addresses: EmailAddressDto[];

  @ApiProperty({ example: 'John' })
  first_name: string;
}
class WebhookUserBodyDto {
  @ApiProperty({ type: WebhookUserDataDto })
  data: WebhookUserDataDto;
}

export function SwaggerWebhookEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Criação de usuário',
      description: 'Webhook do clerk que cria um novo usuário',
    }),
    ApiBody({ type: WebhookUserBodyDto }),
    ApiHeader({
      name: 'Authorization',
      description: 'JWT token do clerk',
      required: true,
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    ApiResponse({
      status: 201,
      description: 'Created: Usuário criado com sucesso',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad: Falha na requisição',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized: JWT token não informado ou inválido',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict: Usuário já existe',
    })
  );
}
