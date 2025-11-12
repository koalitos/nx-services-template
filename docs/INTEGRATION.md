# Template Supabase + NestJS

Este guia descreve como o template está organizado, quais variáveis de ambiente devem ser configuradas e como integrar os módulos principais (Auth, RBAC, Chat e Realtime).

## Visão geral
- `apps/api`: API NestJS com guard Supabase, módulo de matemática (exemplo), chat criptografado e integrações Realtime.
- `apps/auth`: microserviço dedicado a registro/login Supabase, gestão de perfis, grupos, tipos de usuário e permissões por página.
- `prisma/schema.prisma`: modelos compartilhados (profiles, calculation logs, RBAC e chat).

## Pré-requisitos
1. Node.js 20+ e npm.
2. Projeto Supabase com Auth/Realtime/Postgres habilitados.
3. Banco de dados acessível via `DATABASE_URL`/`DIRECT_URL`.
4. (Opcional) Supabase CLI para inspecionar logs.

## Configuração
1. Copie o arquivo de ambiente: `cp .env.example .env`.
2. Preencha as variáveis:
   - `DATABASE_URL`: string de conexão do Postgres (modo pgbouncer).
   - `DIRECT_URL`: string direta (usada por migrations/Studio).
   - `SUPABASE_URL`: URL pública do projeto.
   - `SUPABASE_ANON_KEY`: chave `anon` (consumida pelo front).
   - `SUPABASE_SERVICE_ROLE_KEY`: chave de service role (mantenha somente no backend).
   - `SUPABASE_REALTIME_CHANNEL`: canal padrão para os exemplos (default `calculations`).
   - `ADMIN_API_KEY`: token secreto que habilita os CRUDs administrativos do Auth Service (enviar em `x-admin-key` ou `Authorization: Bearer <token>`).
   - `CHAT_ENCRYPTION_KEY`: chave simétrica de 32 bytes (hex ou base64) usada pelo módulo de chat AES-256-GCM.
3. Gere o Prisma Client após cada mudança no schema: `npm run prisma:generate`.
4. Sincronize o schema com o banco (dev): `npm run prisma:push` ou `npm run prisma:migrate` para versionar.
5. Suba os serviços:
   ```bash
   npm run dev       # API em http://localhost:3000/api
   npm run dev:auth  # Auth Service em http://localhost:3001/auth
   ```

## Autenticação Supabase (API)
- O `SupabaseAuthGuard` lê `Authorization: Bearer <access_token>` e valida o JWT via SDK oficial.
- Controllers que usam `@UseGuards(SupabaseAuthGuard)` podem obter o usuário autenticado com `@SupabaseUser()`.
- Para testar via Swagger (`/api/docs`), gere um token no Supabase e clique em **Authorize** escolhendo o esquema `supabase-auth`.

## Realtime (exemplo math)
- `SupabaseRealtimeService` publica eventos usando o client com service role.
- O método `notifyCalculation` envia `calculation.performed` para o canal definido em `SUPABASE_REALTIME_CHANNEL`.
- Frontend: assine o canal e trate eventos `broadcast`:
  ```ts
  const channel = supabase.channel('calculations');
  channel.on('broadcast', { event: 'calculation.performed' }, ({ payload }) => {
    console.log(payload);
  });
  await channel.subscribe();
  ```

## RBAC e administração (Auth Service)
As rotas abaixo exigem `ADMIN_API_KEY` e estão documentadas no Swagger em `/auth/docs`.

| Endpoint | Descrição |
| --- | --- |
| `POST/GET/PATCH/DELETE /auth/user-groups` | CRUD de grupos. |
| `POST/GET/PATCH/DELETE /auth/user-types` | CRUD de tipos ligados a grupos. |
| `POST/GET/PATCH/DELETE /auth/pages` | Cadastro de páginas e rotas do frontend. |
| `POST/GET/PATCH/DELETE /auth/user-type-page-roles` | Vincula tipos às páginas (viewer/editor/etc.). |
| `GET /auth/profiles` | Lista perfis com tipo/roles carregados. |
| `PATCH /auth/profiles/:supabaseUserId` | Atualiza `displayName`/`avatarUrl`. |
| `PATCH /auth/profiles/:supabaseUserId/user-type` | Define/remove o tipo do usuário. |

Envie `x-admin-key: <ADMIN_API_KEY>` (ou `Authorization: Bearer <ADMIN_API_KEY>`) em todas elas.

## Chat criptografado (API)
O módulo `ChatModule` permite criar salas multiusuário com histórico persistente e notificações Realtime.

### Modelos (Prisma)
- `ChatRoom`: sala de conversa.
- `ChatParticipant`: relacionamento sala/usuário Supabase.
- `ChatMessage`: mensagem criptografada (campos `ciphertext`, `iv`, `authTag`). Apenas o backend conhece `CHAT_ENCRYPTION_KEY`, garantindo criptografia em repouso.

### Endpoints (todos protegidos por `SupabaseAuthGuard`)
| Método e rota | Função |
| --- | --- |
| `POST /api/chat/rooms` | Cria sala informando os demais participantes. O remetente atual é incluído automaticamente. |
| `GET /api/chat/rooms` | Lista salas em que o usuário participa + último recado. |
| `POST /api/chat/rooms/:roomId/messages` | Envia mensagem. O texto é criptografado com AES-256-GCM antes do armazenamento e o evento `chat.message` é publicado em `chat.room.{roomId}`. |
| `GET /api/chat/rooms/:roomId/messages?limit=50&cursor=<id>` | Retorna histórico já descriptografado, com paginação por cursor. |
| `POST /api/chat/direct/:handle` | Cria (ou recupera) uma conversa direta estilo WhatsApp usando o handle amigável do destinatário. |
| `POST /api/chat/direct/:handle/messages` | Envia mensagem direta; cria automaticamente a sala caso ela não exista. |
| `GET /api/chat/direct/:handle/messages` | Recupera o histórico completo de uma conversa direta. |

Cada perfil recebe um `handle` exclusivo (ex.: `joao123`) durante o registro/login. Ele aparece nas respostas de `/auth/register`, `/auth/login` e nos payloads de `/auth/profiles`, e deve ser compartilhado com outros usuários para que possam “adicionar o contato” e iniciar uma conversa direta.

### Consumo Realtime
Assine o canal `chat.room.{roomId}` para receber eventos `chat.message`. O payload já vem descriptografado (conteúdo, remetente, timestamps), facilitando o consumo direto no frontend.

## Prisma e modelos adicionais
- `Profile`: informações locais ligadas ao `supabaseUserId`.
- `CalculationLog`: histórico da rota `math/add`.
- `UserGroup`, `UserType`, `Page`, `UserTypePageRole`: pilares do RBAC administrativo.
- `ChatRoom`, `ChatParticipant`, `ChatMessage`: descritos acima.

Use `npm run prisma:migrate` para versionar alterações e `npm run prisma:studio` para depurar dados.

## Próximos passos sugeridos
- Criar seeds para grupos/tipos/páginas padrão.
- Propagar as roles retornadas pelo Auth Service no frontend/guards do `apps/api`.
- Automatizar deploy com `npm run deploy:affected`, publicando apenas os serviços afetados.
