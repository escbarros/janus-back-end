import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerEventThumbnailEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Thumbnail do evento',
      description: 'Retorna a URL da thumbnail do evento',
    }),
    ApiHeader({
      name: 'Authorization',
      description: 'JWT token do clerk',
      required: true,
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    ApiResponse({
      status: 200,
      description: 'OK: Imagem obtida com sucesso',
      schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            example: 'https://example.com/events/event-1.jpg',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden: Usuário não tem acesso a este evento',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized: JWT token não informado ou inválido',
    })
  );
}
