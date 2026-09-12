# Deploy

O backend (.NET/ASP.NET Core + PostgreSQL) roda numa VPS pessoal. O frontend
(Angular) roda no Vercel.

## Backend na VPS

VPS Hostinger (`srv1892430.hstgr.cloud`), com uma estrutura compartilhada
entre vários projetos:

- `/opt/edge/` — Traefik (proxy reverso único pra todos os projetos, TLS via
  Let's Encrypt, rede Docker externa `edge`)
- `/opt/infra/postgres/` — Postgres compartilhado (16-alpine, sem porta
  publicada, superusuário é `root`), rede Docker externa `db`
- `/opt/apps/<projeto>/` — um diretório por projeto, cada um com seu próprio
  `docker-compose.prod.yml`, sem proxy reverso nem banco próprios

O projeto ainda não tem domínio próprio, então a API usa o hostname da VPS
com uma porta dedicada (mesmo padrão dos outros projetos hospedados aqui):
[https://srv1892430.hstgr.cloud:3029](https://srv1892430.hstgr.cloud:3029), TLS terminado pelo Traefik.

### 1. Criar a deploy key (só na primeira vez)

O repositório é privado. Gera uma chave SSH só de leitura na VPS e cadastra
como Deploy Key em `Settings → Deploy keys` do repo no GitHub:

```bash
ssh-keygen -t ed25519 -C "deploy-sistema-gastos" -f ~/.ssh/deploy_sistema_gastos -N ""
cat ~/.ssh/deploy_sistema_gastos.pub
```

```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
cat >> ~/.ssh/config << 'EOF'
Host github-gastos
    HostName github.com
    User git
    IdentityFile ~/.ssh/deploy_sistema_gastos
EOF
```

### 2. Clonar o repositório

```bash
mkdir -p /opt/apps/sistema-de-gastos
git clone github-gastos:andree911/sistema-de-gastos.git /opt/apps/sistema-de-gastos
```

### 3. Criar o banco e a role no Postgres compartilhado

```bash
docker exec -it postgres-postgres-1 psql -U root -d postgres
```

```sql
CREATE ROLE gastos_app WITH LOGIN PASSWORD 'SENHA_FORTE_AQUI';
CREATE DATABASE controlegastos OWNER gastos_app;
```

### 4. Configurar variáveis de ambiente

```bash
cd /opt/apps/sistema-de-gastos/backend
cp .env.example .env
```

Edita `backend/.env`:

- `ConnectionStrings__Default=Host=postgres;Port=5432;Database=controlegastos;Username=gastos_app;Password=SENHA_FORTE_AQUI`
- `Jwt__Key` (gera com `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))` no PowerShell)
- `Jwt__Issuer=ControleGastos`
- `Jwt__Audience=ControleGastos`

As migrations do EF Core são aplicadas automaticamente quando a API sobe em
produção (`Database.Migrate()` no `Program.cs`) — não precisa rodar
`dotnet ef database update` manualmente.

### 5. Garantir que o entrypoint existe no Traefik

`/opt/edge/docker-compose.yml` precisa ter o entrypoint `app-gastos-api`
(`:3029`) declarado no `command:` e publicado em `ports:`, seguindo o mesmo
padrão dos outros projetos já registrados ali. Depois de editar, aplicar com
`docker compose up -d` dentro de `/opt/edge` (reinicia o Traefik — alguns
segundos de indisponibilidade pros outros projetos também).

### 6. Subir o container

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Builda o backend (Dockerfile multi-stage: SDK pra compilar, ASP.NET runtime
pra rodar) e registra a rota no Traefik via labels — o certificado TLS é
emitido sozinho na primeira requisição.

### 7. Verificar

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Acesse [https://srv1892430.hstgr.cloud:3029](https://srv1892430.hstgr.cloud:3029) (deve responder com o texto
`API de controle de gastos`).

### 8. Atualizar depois de um novo push

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Frontend no Vercel

Projeto importado direto do GitHub (`andree911/sistema-de-gastos`), com:

| Config | Valor |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Angular |
| Output Directory | `dist/frontend/browser` |

URL: [https://frontend-sandy-eight-67.vercel.app](https://frontend-sandy-eight-67.vercel.app)

Não precisa de variável de ambiente no Vercel — a URL da API é resolvida em
tempo de build pelo próprio Angular, via `fileReplacements` no
`angular.json` (troca `environments/environment.ts` por
`environments/environment.prod.ts` na configuração `production`, que é a
padrão). Pra apontar pra uma API diferente, edita
`frontend/src/environments/environment.prod.ts` e faz um novo push — o
Vercel builda de novo sozinho.

Um `frontend/vercel.json` com rewrite pra `index.html` garante que rotas do
Angular Router (`/transacoes`, `/login`, etc.) funcionem em reload direto ou
acesso por link, já que é uma SPA sem SSR.

### CORS

Toda vez que a URL do Vercel mudar (ex: novo projeto, domínio custom), tem
que atualizar a lista de origens permitidas no `AddCors` do
`backend/Program.cs` e fazer um novo deploy do backend na VPS.
