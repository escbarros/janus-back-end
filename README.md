# Janus — API do Interfone Inteligente Acessível

Back-end desenvolvido como parte do Trabalho de Conclusão de Curso de Engenharia de Computação (PUCPR, 2025), cujo objetivo é oferecer uma solução de interfonia residencial acessível para pessoas com deficiência auditiva ou de fala.

Interfones e campainhas convencionais dependem de sinais sonoros, o que cria uma barreira de comunicação para usuários surdos ou com perda auditiva. Segundo a PNS 2019 (IBGE), cerca de 2,3 milhões de brasileiros declararam grande dificuldade ou incapacidade total de ouvir — uma parcela significativa da população frequentemente negligenciada pelas soluções de automação residencial disponíveis no mercado.

A Janus API é o núcleo de todo o sistema: gerencia dispositivos embarcados, controla acessos e convites, processa eventos (toque de campainha, travamento/destravamento), orquestra chamadas de vídeo em tempo real e envia notificações push — oferecendo ao usuário uma experiência de interfonia completamente visual.

---

## Sumário

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Quick Start](#quick-start)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Autenticação e Segurança](#autenticação-e-segurança)
- [Referência da API](#referência-da-api)
  - [Usuários](#usuários)
  - [Dispositivos](#dispositivos)
  - [Chamadas](#chamadas)
  - [Convites](#convites)
  - [Eventos](#eventos)
- [Códigos de Status e Tratamento de Erros](#códigos-de-status-e-tratamento-de-erros)
- [Testes](#testes)
- [Deploy com Docker](#deploy-com-docker)

---

## Stack Tecnológico

| Categoria | Tecnologia |
|---|---|
| Linguagem | TypeScript 5.7 |
| Framework | NestJS 11 |
| Banco de Dados | PostgreSQL 15 |
| ORM | Prisma 6 |
| Autenticação | Clerk (JWT / JWKS) |
| Mensageria | RabbitMQ 3 |
| Protocolo IoT | MQTT (HiveMQ Cloud) |
| Armazenamento | AWS S3 |
| Notificações Push | Expo Server SDK |
| Documentação | Swagger / Scalar |
| Containerização | Docker + Docker Compose |
| Runtime | Node.js 20 |

---

## Arquitetura do Sistema

O sistema é composto por três componentes principais:

- **Dispositivo Embarcado** — Raspberry Pi 4 instalado na entrada da residência (câmera, microfone, alto-falante, servo motor).
- **Aplicativo Móvel** — App em React Native que serve como interface principal do usuário.
- **Janus API** — este repositório; intermediador central entre dispositivo e aplicativo.

```
[Raspberry Pi] ←— MQTT (HiveMQ) —→ [Janus API] ←— HTTPS/JWT —→ [App Mobile]
                                         |
                         ┌───────────────┼───────────────┐
                      [PostgreSQL]  [RabbitMQ]       [AWS S3]
                                         |
                                  [Expo Push Notifications]
```

---

## Quick Start

### Pré-requisitos

- [Node.js](https://nodejs.org/) **v20+**
- [Docker](https://www.docker.com/) e **Docker Compose** (para rodar PostgreSQL e RabbitMQ localmente)
- Uma conta no [Clerk](https://clerk.com/) (plano gratuito suficiente para desenvolvimento)
- Credenciais AWS S3 (ou emulação local com LocalStack)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/janus-back-end.git
cd janus-back-end
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme as instruções da seção [Variáveis de Ambiente](#variáveis-de-ambiente).

### 4. Suba os serviços de infraestrutura (PostgreSQL + RabbitMQ)

```bash
docker compose up postgres rabbitmq -d
```

Aguarde alguns segundos para o PostgreSQL inicializar completamente.

### 5. Execute as migrações do banco de dados

```bash
npx prisma migrate dev
```

### 6. Inicie o servidor em modo de desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000/api/v1`.

A documentação interativa estará disponível em:
- `http://localhost:3000/api` — Swagger UI
- `http://localhost:3000/reference` — Scalar API Reference

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ─── Banco de Dados ────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://janus_user:janus_password@localhost:5432/janus_db"

# ─── Servidor ──────────────────────────────────────────────────────────────────
PORT=3000

# ─── Clerk (Autenticação) ──────────────────────────────────────────────────────
# Encontre em: Clerk Dashboard → API Keys
CLERK_API_KEY="sk_test_..."

# Encontre em: Clerk Dashboard → JWT Templates → Issuer
CLERK_ISSUER="https://your-instance.clerk.accounts.dev"

# Encontre em: Clerk Dashboard → API Keys → Advanced → JWKS URL
CLERK_JWKS_URI="https://your-instance.clerk.accounts.dev/.well-known/jwks.json"

# Encontre em: Clerk Dashboard → Webhooks → Signing Secret
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."

# ─── AWS S3 ────────────────────────────────────────────────────────────────────
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."

# ─── RabbitMQ ──────────────────────────────────────────────────────────────────
RABBITMQ_URL="amqp://localhost:5672"
```

---

## Autenticação e Segurança

### Autenticação de Usuários (JWT via Clerk)

A API utiliza o **Clerk** como provedor de identidade. Os tokens JWT são emitidos pelo Clerk e validados pela API via **JWKS** (JSON Web Key Sets), sem armazenar segredos localmente.

**Como enviar o token em cada requisição:**

```http
Authorization: Bearer <seu-jwt-token>
```

**Exemplo com cURL:**

```bash
curl -X GET http://localhost:3000/api/v1/user/auth \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6..."
```

O token é obtido pelo aplicativo móvel após o fluxo de login do Clerk e deve ser incluído no cabeçalho de **todas** as rotas protegidas.

### Autenticação de Dispositivos

Rotas chamadas diretamente pelo Raspberry Pi (eventos de campainha, travamento, etc.) utilizam um esquema próprio baseado no `deviceId` enviado via header:

```http
x-device-id: <id-do-dispositivo>
```

Essas rotas **não** utilizam JWT de usuário e são protegidas por um guard dedicado.

### Webhook do Clerk

O endpoint `POST /api/v1/user/webhook` recebe notificações do Clerk para provisionamento de usuários. Ele é protegido por verificação de assinatura HMAC-SHA256 via **Svix**, com tolerância de 5 minutos no timestamp.

---

## Referência da API

**URL Base:** `http://localhost:3000/api/v1`

Todos os exemplos abaixo assumem que a API está rodando localmente. Substitua pela URL de produção conforme necessário.

---

### Usuários

#### `GET /user/auth`

Retorna as informações do usuário autenticado. Cria o usuário no banco de dados na primeira chamada se ele ainda não existir.

**Autenticação:** Bearer Token (obrigatório)

**Exemplo de Requisição:**

```bash
curl -X GET http://localhost:3000/api/v1/user/auth \
  -H "Authorization: Bearer <token>"
```

**Exemplo de Resposta — `200 OK`:**

```json
{
  "id": "user_2abc123",
  "email": "joao@email.com",
  "name": "João Silva",
  "imageUrl": "https://img.clerk.com/...",
  "notificationTokens": ["ExponentPushToken[xxxxxx]"]
}
```

---

#### `PATCH /user/add-notification`

Associa um token de notificação push Expo ao usuário autenticado.

**Autenticação:** Bearer Token (obrigatório)

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `token` | `string` | Sim | Token Expo Push (`ExponentPushToken[...]`) |

**Exemplo de Requisição:**

```bash
curl -X PATCH http://localhost:3000/api/v1/user/add-notification \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "ExponentPushToken[xxxxxx]" }'
```

**Resposta — `200 OK`:** Retorna o usuário atualizado.

---

#### `PATCH /user/remove-notification`

Remove um token de notificação push do usuário autenticado.

**Autenticação:** Bearer Token (obrigatório)

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `token` | `string` | Sim | Token Expo Push a ser removido |

---

### Dispositivos

#### `GET /device/thumbnail/:deviceId`

Retorna uma URL pré-assinada (AWS S3) para a thumbnail do dispositivo.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID único do dispositivo |

**Exemplo de Requisição:**

```bash
curl -X GET http://localhost:3000/api/v1/device/thumbnail/device_abc \
  -H "Authorization: Bearer <token>"
```

**Exemplo de Resposta — `200 OK`:**

```json
{
  "url": "https://janusintercom.s3.amazonaws.com/thumbnails/device_abc.jpg?X-Amz-..."
}
```

---

#### `PATCH /device/nickname/:deviceId`

Atualiza o apelido (nome de exibição) de um dispositivo.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID único do dispositivo |

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nickname` | `string` | Sim | Novo nome de exibição para o dispositivo |

**Exemplo de Requisição:**

```bash
curl -X PATCH http://localhost:3000/api/v1/device/nickname/device_abc \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "nickname": "Portão Principal" }'
```

---

#### `GET /device/access/:deviceId`

Retorna a lista de usuários com acesso ao dispositivo, incluindo nível de permissão e foto de perfil.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID único do dispositivo |

**Exemplo de Resposta — `200 OK`:**

```json
[
  {
    "userId": "user_2abc123",
    "name": "João Silva",
    "imageUrl": "https://img.clerk.com/...",
    "accessLevel": "OWNER"
  },
  {
    "userId": "user_2def456",
    "name": "Maria Souza",
    "imageUrl": "https://img.clerk.com/...",
    "accessLevel": "USER"
  }
]
```

**Níveis de acesso possíveis:** `OWNER` · `ADMIN` · `USER`

---

### Chamadas

#### `POST /call/:deviceId/start`

Inicia uma chamada de vídeo com o dispositivo especificado. Notifica os usuários com acesso ao dispositivo via push notification.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID do dispositivo com o qual iniciar a chamada |

**Exemplo de Requisição:**

```bash
curl -X POST http://localhost:3000/api/v1/call/device_abc/start \
  -H "Authorization: Bearer <token>"
```

**Exemplo de Resposta — `201 Created`:**

```json
{
  "callId": "call_xyz789",
  "deviceId": "device_abc",
  "status": "ACTIVE",
  "startedAt": "2025-10-01T14:32:00.000Z"
}
```

---

#### `POST /call/:deviceId/stop`

Encerra a chamada ativa com o dispositivo.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID do dispositivo |

---

#### `GET /call/device/:deviceId`

Retorna o histórico de chamadas de um dispositivo.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `deviceId` | `string` | ID do dispositivo |

**Exemplo de Resposta — `200 OK`:**

```json
[
  {
    "callId": "call_xyz789",
    "status": "FINISHED",
    "startedAt": "2025-10-01T14:32:00.000Z",
    "endedAt": "2025-10-01T14:35:00.000Z"
  }
]
```

---

#### `GET /call/:callId`

Retorna os detalhes de uma chamada específica, incluindo a URL pré-assinada do vídeo gravado (S3).

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `callId` | `string` | ID da chamada |

**Exemplo de Resposta — `200 OK`:**

```json
{
  "callId": "call_xyz789",
  "status": "FINISHED",
  "videoUrl": "https://janusintercom.s3.amazonaws.com/calls/call_xyz789.mp4?X-Amz-...",
  "messages": [
    {
      "content": "Olá, pode abrir?",
      "origin": "DEVICE",
      "sentAt": "2025-10-01T14:32:10.000Z"
    },
    {
      "content": "Sim, um momento!",
      "origin": "USER",
      "sentAt": "2025-10-01T14:32:15.000Z"
    }
  ]
}
```

**Origens de mensagem:** `USER` (digitado pelo morador) · `DEVICE` (transcrito do visitante via STT)

---

### Convites

#### `POST /invite/send`

Envia um convite para outro usuário acessar um dispositivo.

**Autenticação:** Bearer Token (obrigatório)

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `deviceId` | `string` | Sim | ID do dispositivo a compartilhar |
| `inviteeEmail` | `string` | Sim | E-mail do usuário a ser convidado |
| `accessLevel` | `string` | Sim | Nível de acesso: `ADMIN` ou `USER` |

**Exemplo de Requisição:**

```bash
curl -X POST http://localhost:3000/api/v1/invite/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_abc",
    "inviteeEmail": "maria@email.com",
    "accessLevel": "USER"
  }'
```

**Exemplo de Resposta — `201 Created`:**

```json
{
  "inviteId": "invite_123",
  "status": "PENDING",
  "deviceId": "device_abc",
  "inviteeEmail": "maria@email.com",
  "accessLevel": "USER",
  "createdAt": "2025-10-01T10:00:00.000Z"
}
```

---

#### `GET /invite/:inviteId`

Retorna os detalhes de um convite.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `inviteId` | `string` | ID do convite |

---

#### `POST /invite/:inviteId/accept`

Aceita um convite recebido. O usuário autenticado ganha acesso ao dispositivo no nível especificado.

**Autenticação:** Bearer Token (obrigatório)

**Resposta — `200 OK`:** Retorna o convite atualizado com `status: "ACCEPTED"`.

---

#### `POST /invite/:inviteId/reject`

Rejeita um convite recebido.

**Autenticação:** Bearer Token (obrigatório)

**Resposta — `200 OK`:** Retorna o convite atualizado com `status: "REJECTED"`.

**Status possíveis de convite:** `PENDING` · `ACCEPTED` · `REJECTED` · `EXPIRED` · `REVOKED`

---

### Eventos

#### `GET /events/user`

Retorna todos os eventos associados ao usuário autenticado (toque de campainha, travamentos, convites recebidos, etc.), ordenados por data decrescente.

**Autenticação:** Bearer Token (obrigatório)

**Exemplo de Resposta — `200 OK`:**

```json
[
  {
    "eventId": "evt_001",
    "type": "DOORBELL",
    "deviceId": "device_abc",
    "thumbnailUrl": "https://janusintercom.s3.amazonaws.com/...",
    "read": false,
    "createdAt": "2025-10-01T14:31:55.000Z"
  },
  {
    "eventId": "evt_002",
    "type": "DOOR_UNLOCKED",
    "deviceId": "device_abc",
    "read": true,
    "createdAt": "2025-10-01T14:35:10.000Z"
  }
]
```

**Tipos de evento:** `DOORBELL` · `DOOR_UNLOCKED` · `DOOR_LOCKED` · `INVITE_SENT` · `INVITE_ACCEPTED` · `INVITE_RECEIVED`

---

#### `PATCH /events/:eventId/read`

Marca um evento como lido.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `eventId` | `string` | ID do evento |

---

#### `GET /events/thumbnail/:eventId`

Retorna uma URL pré-assinada (AWS S3) para a thumbnail de um evento específico.

**Autenticação:** Bearer Token (obrigatório)

**Parâmetros de Rota:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `eventId` | `string` | ID do evento |

---

#### `POST /events/doorbell`

**Uso exclusivo do dispositivo embarcado.** Registra um evento de toque de campainha e notifica os usuários com acesso ao dispositivo.

**Autenticação:** Header `x-device-id` (obrigatório)

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `imageKey` | `string` | Sim | Chave S3 da imagem capturada pelo dispositivo |

---

#### `POST /events/locked` e `POST /events/unlocked`

**Uso exclusivo do dispositivo embarcado.** Registra um evento de travamento ou destravamento da fechadura.

**Autenticação:** Header `x-device-id` (obrigatório)

**Body:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `triggeredBy` | `string` | Não | Identificador de quem disparou a ação |

---

## Códigos de Status e Tratamento de Erros

### Tabela de Códigos HTTP

| Código | Status | Descrição |
|---|---|---|
| `200` | OK | Requisição processada com sucesso |
| `201` | Created | Recurso criado com sucesso |
| `400` | Bad Request | Dados inválidos ou ausentes no corpo da requisição |
| `401` | Unauthorized | Token JWT ausente, inválido ou expirado |
| `403` | Forbidden | Token válido, mas sem permissão para o recurso |
| `404` | Not Found | Recurso não encontrado |
| `500` | Internal Server Error | Erro interno inesperado no servidor |


## Deploy com Docker

O projeto inclui um `Dockerfile` com build multi-stage otimizado para produção e um `docker-compose.yml` que sobe toda a infraestrutura necessária.

### Subir toda a stack com Docker Compose

```bash
docker compose up --build -d
```

Isso irá subir:
- **API** na porta `3000`
- **PostgreSQL 15** na porta `5432`
- **RabbitMQ 3** nas portas `5672` (AMQP) e `15672` (Management UI)

> A imagem da API executa automaticamente `npx prisma migrate deploy` antes de inicializar o servidor.

### Credenciais padrão do PostgreSQL (desenvolvimento)

```
Host:     localhost:5432
Database: janus_db
User:     janus_user
Password: janus_password
```

> **Para produção:** substitua as credenciais padrão por variáveis de ambiente seguras e nunca utilize as credenciais de desenvolvimento.

### Painel de administração do RabbitMQ

Acesse `http://localhost:15672` com as credenciais padrão `guest / guest` para monitorar filas e mensagens.
