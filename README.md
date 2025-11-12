# Template Supabase + Nest + Nx

Backend de referencia para iniciar projetos NestJS usando Nx, Prisma e Supabase (Auth + Realtime), agora dividido em dois servicos:

- `apps/api`: rotas de negocio (math/add, health, realtime etc.).
- `apps/auth`: microservico dedicado a registrar e autenticar usuarios.

## Stack principal
- **Nx 22** para orquestrar apps/libs.
- **NestJS 11** em ambos os servicos.
- **Supabase** (Auth, Realtime, Storage via SDK oficial).
- **Prisma 5** apontando para o Postgres do Supabase.
- **Swagger** exposto em `/api/docs` (API) e `/auth/docs` (Auth Service).

## Como rodar
1. Copie as variaveis:
   ```bash
   cp .env.example .env
   ```
2. Ajuste `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, defina um `ADMIN_API_KEY` forte para proteger as rotas administrativas do Auth Service e gere um `CHAT_ENCRYPTION_KEY` de 32 bytes (hex/base64) para criptografar as mensagens. Os perfis recebem automaticamente um `handle` legível, usado nas conversas diretas.
3. Gere o client Prisma sempre que alterar `schema.prisma`:
   ```bash
   npm run prisma:generate
   ```
4. Opcional: sincronize o schema com o banco
   ```bash
   npm run prisma:push
   ```
5. Suba os servicos (cada um em um terminal):
   ```bash
   npm run dev         # apps/api (porta 3000)
   npm run dev:auth    # apps/auth (porta 3001)
   ```
   - Health API: `GET http://localhost:3000/api/health`
   - Swagger API: `http://localhost:3000/api/docs`
   - Health Auth: `GET http://localhost:3001/auth/health`
   - Swagger Auth: `http://localhost:3001/auth/docs`

## Features entregues
- **Guarda Supabase** (`SupabaseAuthGuard`) para validar tokens Bearer no servico principal.
- **Decorator `@SupabaseUser()`** para consumir o usuario autenticado nas rotas protegidas.
- **Servicos Realtime** que broadcastam `calculation.performed`.
- **PrismaService** compartilhado (schema com `Profile` e `CalculationLog`).
- **Rota de exemplo** `POST /api/math/add`:
  - exige token Supabase;
  - soma dois numeros;
  - registra log via Prisma;
  - dispara evento no Supabase Realtime.
- **Microservico de Auth** (`apps/auth`) com `POST /auth/register` e `POST /auth/login` para criar usuarios e emitir JWTs do Supabase (via Service Role Key).
- **Console RBAC protegido por API key**: CRUDs para grupos, tipos, paginas e vinculos tipo/pagina, alem do gerenciamento de perfis (`PATCH /auth/profiles/:supabaseUserId` para atualizar displayName/avatar e `/user-type` para alterar o tipo associado).
- **Handles amigaveis**: cada perfil recebe um identificador unico (ex.: `maria123`) para ser compartilhado em chats diretos ou integrações com outros sistemas.
- **Chat criptografado com historico** (`/api/chat/...`): cria salas multiusuario e conversas diretas tipo WhatsApp (`/api/chat/direct/:handle`), armazena mensagens com AES-256-GCM, expõe historico descriptografado e propaga novos eventos em canais Realtime (`chat.room.{roomId}`).
- **Swagger + ValidationPipe** habilitados em ambos os servicos.

## Scripts uteis
| Script | Descricao |
| --- | --- |
| `npm run dev` | `nx serve api` com watch. |
| `npm run dev:auth` | `nx serve auth` com watch. |
| `npm run build` | Compila API para `dist/apps/api`. |
| `npm run build:auth` | Compila Auth Service para `dist/apps/auth`. |
| `npm run start:prod` | Executa API compilada (`node dist/apps/api/main.js`). |
| `npm run start:auth:prod` | Executa Auth Service compilado (`node dist/apps/auth/main.js`). |
| `npm run test` | `nx test api`. |
| `npm run prisma:generate` | Gera Prisma Client. |
| `npm run prisma:push` / `prisma:migrate` / `prisma:studio` | Fluxo Prisma padrao. |

## Documentacao
Detalhes sobre integraçao com Supabase, Realtime, Prisma e as rotas (incluindo o novo microservico de auth) estao em [`docs/INTEGRATION.md`](docs/INTEGRATION.md).

---
Use os generators do Nx (`npx nx g ...`) para criar novos servicos/libs e expandir este template conforme a evolucao do seu produto.
