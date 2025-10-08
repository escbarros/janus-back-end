import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function SwaggerAuthEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'Autenticação do usuário',
      description: 'Autentica um usuário existente',
    }),
    ApiHeader({
      name: 'Authorization',
      description: 'JWT token do clerk',
      required: true,
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    ApiResponse({
      status: 200,
      description: 'OK: Usuário autenticado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user_2g7np7Hrk0SN6kj5EDMLDaKNL0S' },
          name: { type: 'string', example: 'John' },
          email: { type: 'string', example: 'john@example.com' },
          accesses: {
            type: 'array',
            items: { type: 'object' },
            example: [
              {
                id: { type: 'string', example: 'id-1' },
                nickname: { type: 'string', example: 'Device nickname' },
              },
            ],
          },
          events: {
            type: 'array',
            items: { type: 'object' },
            example: [
              {
                id: { type: 'string', example: 'event-1' },
                type: { type: 'string', example: 'user.created' },
                data: {
                  type: 'object',
                  example: { userId: 'user_2g7np7Hrk0SN6kj5EDMLDaKNL0S' },
                },
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found: Usuário não encontrado',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized: JWT token não informado ou inválido',
    })
  );
}
