# Template Supabase + NestJS

Este template entrega um backend NestJS organizado com Nx, autenticação e realtime usando Supabase e ORM via Prisma.

## Sumário rápido
- `apps/api` — API NestJS (main entry em `apps/api/src/main.ts`).
- `prisma/schema.prisma` — modelos persistidos no Postgres do Supabase.
- `apps/api/src/app/supabase` — integração com Supabase (serviços, guard e decorator).
- `apps/api/src/app/math` — exemplo de rota autenticada (`POST /api/math/add`).

## Pré-requisitos
1. Node 20+ com npm.
2. Banco Postgres do Supabase (pode reutilizar o mesmo projeto que já fornece Auth/Realtime).
3. Supabase CLI (opcional) para inspecionar logs.

## Configuração
1. Copie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
2. Preencha variáveis:
   - `DATABASE_URL`: string de conexão do banco do Supabase (`postgresql://...`).
   - `SUPABASE_URL`: URL pública do projeto (`https://xyzcompany.supabase.co`).
   - `SUPABASE_ANON_KEY`: chave `anon` (JWT público usado pelo front).
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service role (mantê-la apenas no backend).
   - `SUPABASE_REALTIME_CHANNEL`: canal padrão para broadcasts (ex.: `calculations`).
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
   Swagger ficará em `http://localhost:3000/api/docs`.

## Autenticação Supabase
- O guard `SupabaseAuthGuard` lê o header `Authorization: Bearer <token>` e consulta o Supabase Auth via `SupabaseService`.
- Ao anotar um controller com `@UseGuards(SupabaseAuthGuard)` o request passa a ter o usuário `supabase.user`.
- Use o decorator `@SupabaseUser()` para injetar os dados do usuário em handlers.
- Para testar pelo Swagger: autentique via Supabase (por ex. `supabase.auth.signIn`, CLI ou dashboard), copie o `access_token` e cole no botão **Authorize**.

## Realtime
- `SupabaseRealtimeService` usa o client com service role para publicar eventos `broadcast`.
- O método `notifyCalculation` envia payloads para o canal configurado (`SUPABASE_REALTIME_CHANNEL`) com o evento `calculation.performed`.
- No frontend, basta assinar:
  ```ts
  const channel = supabase.channel('calculations');
  channel.on('broadcast', { event: 'calculation.performed' }, ({ payload }) => {
    console.log(payload);
  });
  await channel.subscribe();
  ```
- É possível usar o método `broadcast` para outros eventos/canais.

## Prisma e modelos
- `Profile`: armazena dados adicionais ligados ao `supabaseUserId`.
- `CalculationLog`: audit trail das somas feitas na rota de exemplo.
- Use `npm run prisma:migrate` para versionar alterações e `npm run prisma:studio` para visualizar dados.

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
2. Serviço grava `CalculationLog` via Prisma.
3. Evento realtime é disparado com `operands`, `result`, `logId` e `userId`.
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

## Swagger
- Configurado em `apps/api/src/main.ts`.
- Documenta autenticação bearer (`supabase-auth`) e as rotas `health` + `math`.
- JSON disponível em `/api/docs/swagger.json` (útil para gerar SDKs).

## Scripts úteis
| Script | Descrição |
| ------ | --------- |
| `npm run dev` | `nx serve api` com watch e HMR. |
| `npm run build` | Compila para `dist/apps/api`. |
| `npm run start:prod` | Executa o build compilado. |
| `npm run test` | `nx test api`. |
| `npm run lint` | `nx lint api`. |
| `npm run prisma:(generate|push|migrate|studio)` | Operações Prisma padrão. |

## Próximos passos sugeridos
- Criar migrations oficiais (`npm run prisma:migrate`) para ambientes controlados.
- Ampliar os módulos Nx (por exemplo `libs/database`) se houver múltiplos apps.
- Configurar pipelines CI/CD usando os targets Nx disponíveis.
