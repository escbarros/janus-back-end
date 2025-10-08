import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerEventReadEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Evento lido',
      description: 'Marca evento como lido',
    }),
    ApiHeader({
      name: 'Authorization',
      description: 'JWT token do clerk',
      required: true,
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    ApiResponse({
      status: 204,
      description: 'No Content: Evento marcado como lido com sucesso',
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
