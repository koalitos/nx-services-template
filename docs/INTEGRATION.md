# Template Supabase + NestJS

Este template entrega um backend NestJS organizado com Nx, autenticaÃ§Ã£o e realtime usando Supabase e ORM via Prisma.

## SumÃ¡rio rÃ¡pido
- `apps/api` â€” API NestJS (main entry em `apps/api/src/main.ts`).
- `prisma/schema.prisma` â€” modelos persistidos no Postgres do Supabase.
- `apps/api/src/app/supabase` â€” integraÃ§Ã£o com Supabase (serviÃ§os, guard e decorator).
- `apps/api/src/app/math` â€” exemplo de rota autenticada (`POST /api/math/add`).

## PrÃ©-requisitos
1. Node 20+ com npm.
2. Banco Postgres do Supabase (pode reutilizar o mesmo projeto que jÃ¡ fornece Auth/Realtime).
3. Supabase CLI (opcional) para inspecionar logs.

## ConfiguraÃ§Ã£o
1. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Preencha variÃ¡veis:
   - `DATABASE_URL`: string de conexÃ£o do banco do Supabase (`postgresql://...`).
   - `SUPABASE_URL`: URL pÃºblica do projeto (`https://xyzcompany.supabase.co`).
   - `SUPABASE_ANON_KEY`: chave `anon` (JWT pÃºblico usado pelo front).
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service role (mantÃª-la apenas no backend).
   - `SUPABASE_REALTIME_CHANNEL`: canal padrÃ£o para broadcasts (ex.: `calculations`).
3. Gere o client Prisma sempre que alterar o schema:
   ```bash
   npm run prisma:generate
   ```
4. Aplique o schema no banco (ajuste conforme preferir `db push` ou `migrate`):
   ```bash
   npm run prisma:push
   ```
5. Suba a API:
   ```bash
   npm run dev
   ```
   Swagger ficarÃ¡ em `http://localhost:3000/api/docs`.

## AutenticaÃ§Ã£o Supabase
- O guard `SupabaseAuthGuard` lÃª o header `Authorization: Bearer <token>` e consulta o Supabase Auth via `SupabaseService`.
- Ao anotar um controller com `@UseGuards(SupabaseAuthGuard)` o request passa a ter o usuÃ¡rio `supabase.user`.
- Use o decorator `@SupabaseUser()` para injetar os dados do usuÃ¡rio em handlers.
- Para testar pelo Swagger: autentique via Supabase (por ex. `supabase.auth.signIn`, CLI ou dashboard), copie o `access_token` e cole no botÃ£o **Authorize**.

## Realtime
- `SupabaseRealtimeService` usa o client com service role para publicar eventos `broadcast`.
- O mÃ©todo `notifyCalculation` envia payloads para o canal configurado (`SUPABASE_REALTIME_CHANNEL`) com o evento `calculation.performed`.
- No frontend, basta assinar:
  ```ts
  const channel = supabase.channel('calculations');
  channel.on('broadcast', { event: 'calculation.performed' }, ({ payload }) => {
    console.log(payload);
  });
  await channel.subscribe();
  ```
- Ã‰ possÃ­vel usar o mÃ©todo `broadcast` para outros eventos/canais.

## Prisma e modelos
- `Profile`: armazena dados adicionais ligados ao `supabaseUserId`.
- `CalculationLog`: audit trail das somas feitas na rota de exemplo.
- Use `npm run prisma:migrate` para versionar alteraÃ§Ãµes e `npm run prisma:studio` para visualizar dados.

## Rota de exemplo `POST /api/math/add`
Corpo aceito:
```json
{
  "a": 5.5,
  "b": 10
}
```
Fluxo:
1. Guard valida o token Supabase.
2. ServiÃ§o grava `CalculationLog` via Prisma.
3. Evento realtime Ã© disparado com `operands`, `result`, `logId` e `userId`.
4. Resposta:
   ```json
   {
     "result": 15.5,
     "logId": "uuid",
     "supabaseUserId": "uuid-do-supabase",
     "recordedAt": "2025-11-11T16:11:00.000Z"
   }
   ```

## Gestao de usuarios
### `POST /auth/register`
- Disponivel no novo microservico `apps/auth` (porta padrao 3001, prefixo `/auth`).
- Usa a Service Role Key mantida no backend para criar um usuario via Supabase Auth e sincroniza o `Profile`.
- Payload:
  ```json
  {
    "email": "user@example.com",
    "password": "MySecret123",
    "displayName": "User Example"
  }
  ```
- Resposta inclui o usuario retornado pelo Supabase e o registro `Profile` gerado/atualizado.

### `POST /auth/login`
- Tambem exposto pelo microservico de auth, autentica com email/senha usando a anon key.
- Payload:
  ```json
  {
    "email": "user@example.com",
    "password": "MySecret123"
  }
  ```
- Resposta:
  ```json
  {
    "tokenType": "bearer",
    "accessToken": "eyJ...JWT",
    "refreshToken": "....",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "userMetadata": { "displayName": "User Example" }
    }
  }
  ```
- Use o `accessToken` no header `Authorization: Bearer <token>` para chamar rotas protegidas do servico principal (`/api/math/add`).

## Rotas administrativas (RBAC)
- Defina `ADMIN_API_KEY` no `.env` e envie o valor no header `x-admin-key` ou `Authorization: Bearer <chave>` para acessar os CRUDs do Auth Service.
- Endpoints disponiveis:
  - `POST/GET/PATCH/DELETE /auth/user-groups` e `/auth/user-types` para organizar grupos e tipos.
  - `POST/GET/PATCH/DELETE /auth/pages` e `/auth/user-type-page-roles` para registrar paginas do frontend e atrelar permissoes por tipo.
  - `PATCH /auth/profiles/:supabaseUserId` para atualizar `displayName`/`avatarUrl`.
  - `PATCH /auth/profiles/:supabaseUserId/user-type` para vincular ou remover um tipo de usuario do perfil.
- Todos retornam os relacionamentos principais (tipo com grupo, roles com pagina, perfil com tipo) para facilitar a exibicao em dashboards administrativos.

## Swagger
- Configurado em `apps/api/src/main.ts`.
- Documenta autenticaÃ§Ã£o bearer (`supabase-auth`) e as rotas `health` + `math`.
- JSON disponÃ­vel em `/api/docs/swagger.json` (Ãºtil para gerar SDKs).

## Scripts Ãºteis
| Script | DescriÃ§Ã£o |
| ------ | --------- |
| `npm run dev` | `nx serve api` com watch e HMR. |
| `npm run build` | Compila para `dist/apps/api`. |
| `npm run start:prod` | Executa o build compilado. |
| `npm run test` | `nx test api`. |
| `npm run lint` | `nx lint api`. |
| `npm run prisma:(generate|push|migrate|studio)` | OperaÃ§Ãµes Prisma padrÃ£o. |

## PrÃ³ximos passos sugeridos
- Criar migrations oficiais (`npm run prisma:migrate`) para ambientes controlados.
- Ampliar os mÃ³dulos Nx (por exemplo `libs/database`) se houver mÃºltiplos apps.
- Configurar pipelines CI/CD usando os targets Nx disponÃ­veis.
