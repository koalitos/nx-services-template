# Template Supabase + NestJS

Este guia explica como o template está organizado, quais variáveis de ambiente configurar e como integrar os módulos principais (Auth, RBAC, Chat e Realtime).

## Visão geral
- `apps/api`: API NestJS com guard Supabase, chat criptografado e integrações Realtime.
- `apps/auth`: microserviço dedicado a registro/login Supabase, gestão de perfis, grupos, tipos de usuário e permissões por página.
- `prisma/schema.prisma`: modelos compartilhados (profiles, RBAC e chat).

## Pré-requisitos
1. Node.js 20+ e npm.
2. Projeto Supabase com Auth/Realtime/Postgres habilitados.
3. Banco acessível via `DATABASE_URL`/`DIRECT_URL`.
4. (Opcional) Supabase CLI para depuração.

## Configuração
1. Duplique o arquivo de ambiente: `cp .env.example .env`.
2. Preencha as variáveis:
   - `DATABASE_URL`: Postgres via pgbouncer.
   - `DIRECT_URL`: conexão direta (migrations/Studio).
   - `SUPABASE_URL`: URL pública do projeto.
   - `SUPABASE_ANON_KEY`: chave `anon` (front).
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service role (somente backend).
   - `SUPABASE_REALTIME_CHANNEL`: canal padrão (default `calculations`, usado apenas como fallback).
   - `ADMIN_API_KEY`: token que libera o console administrativo do Auth Service (enviar em `x-admin-key` ou `Authorization: Bearer <token>`).
   - `CHAT_ENCRYPTION_KEY`: chave simétrica de 32 bytes (hex/base64) usada pelo chat AES-256-GCM.
3. Gere o Prisma Client sempre que alterar o schema: `npm run prisma:generate`.
4. Sincronize o schema com o banco (`npm run prisma:push` ou `npm run prisma:migrate`). 
5. Suba os serviços:
   ```bash
   npm run dev       # API em http://localhost:3000/api
   npm run dev:auth  # Auth Service em http://localhost:3001/auth
   ```

## Autenticação Supabase (API)
- O `SupabaseAuthGuard` lê `Authorization: Bearer <access_token>` e valida o JWT via SDK oficial.
- Use `@SupabaseUser()` para injetar o usuário autenticado nas rotas protegidas.
- Para testar via Swagger (`/api/docs`), gere um token no Supabase e clique em **Authorize** escolhendo `supabase-auth`.

## Realtime (chat)
- `SupabaseRealtimeService` usa a Service Role Key para publicar eventos.
- O chat dispara `chat.message` e `chat.message.read` no canal `chat.room.{roomId}` sempre que alguém envia ou lê uma mensagem.
- Frontend: assine o canal específico e trate os eventos `broadcast`:
  ```ts
  const channel = supabase.channel(`chat.room.${roomId}`);
  channel.on('broadcast', { event: 'chat.message' }, ({ payload }) => {
    console.log('Nova mensagem', payload);
  });
  channel.on('broadcast', { event: 'chat.message.read' }, ({ payload }) => {
    console.log('Mensagem lida', payload);
  });
  await channel.subscribe();
  ```

## RBAC e administração (Auth Service)
As rotas a seguir exigem `ADMIN_API_KEY` e estão documentadas em `/auth/docs`:

| Endpoint | Descrição |
| --- | --- |
| `POST/GET/PATCH/DELETE /auth/user-groups` | CRUD de grupos. |
| `POST/GET/PATCH/DELETE /auth/user-types` | CRUD de tipos vinculados a grupos. |
| `POST/GET/PATCH/DELETE /auth/pages` | Cadastro de páginas/rotas do frontend. |
| `POST/GET/PATCH/DELETE /auth/user-type-page-roles` | Vincula tipos às páginas (viewer/editor/etc.). |
| `GET /auth/profiles` | Lista perfis com tipo/roles carregados. |
| `PATCH /auth/profiles/:supabaseUserId` | Atualiza `displayName`/`avatarUrl`. |
| `PATCH /auth/profiles/:supabaseUserId/user-type` | Define/remove o tipo do usuário. |

## Chat criptografado (API)
O `ChatModule` cria salas multiusuário e conversas diretas estilo WhatsApp, armazena mensagens criptografadas (AES-256-GCM) e mantém recibos de leitura.

### Endpoints (todos exigem `SupabaseAuthGuard`)
| Método e rota | Função |
| --- | --- |
| `POST /api/chat/rooms` | Cria sala informando os participantes (o remetente atual é adicionado automaticamente). |
| `GET /api/chat/rooms` | Lista salas com o último recado e status de leitura. |
| `POST /api/chat/rooms/:roomId/messages` | Envia mensagem criptografada e publica `chat.message`. |
| `GET /api/chat/rooms/:roomId/messages?limit=50&cursor=<id>` | Retorna histórico descriptografado (limite ajustável até 500). |
| `POST /api/chat/direct/:handle` | Cria/recupera conversa direta usando o handle da outra pessoa. |
| `POST /api/chat/direct/:handle/messages` | Envia mensagem direta (cria a sala automaticamente, se preciso). |
| `GET /api/chat/direct/:handle/messages` | Lista o histórico completo da conversa direta. |
| `PATCH /api/chat/rooms/:roomId/messages/:messageId/read` | Marca a mensagem como lida e emite `chat.message.read`. |

Cada perfil recebe um `handle` exclusivo (ex.: `joao123`) durante o registro/login. Ele aparece nas respostas de `/auth/register`, `/auth/login` e `/auth/profiles` e deve ser compartilhado para que outros usuários iniciem conversas diretas.

## Prisma e modelos adicionais
- `Profile`: armazena handles, avatar e vínculos com tipos de usuário.
- `UserGroup`, `UserType`, `Page`, `UserTypePageRole`: pilares do RBAC administrativo.
- `ChatRoom`, `ChatParticipant`, `ChatMessage`, `ChatMessageReceipt`: sustentam o chat criptografado com recibos de leitura.

Use `npm run prisma:migrate` para versionar alterações e `npm run prisma:studio` para depurar dados.

## Próximos passos sugeridos
- Criar seeds para grupos/tipos/páginas padrão (veja `tools/scripts/seed-rbac.ts`).
- Consumir os eventos de `chat.message.read` no frontend para exibir check azul/duplo.
- Automatizar deploy com `npm run deploy:affected`, publicando apenas os serviços alterados.
