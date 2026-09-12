# Controle de Gastos

Sistema de controle financeiro pessoal: registro de gastos e receitas em múltiplas moedas (BRL, USD, EUR), com conversão automática de saldo via cotação em tempo real.

- [`backend/`](./backend) — API em ASP.NET Core (.NET), Entity Framework Core, PostgreSQL, autenticação JWT.
- [`frontend/`](./frontend) — aplicação Angular (standalone components, signals), com componentes customizados de select e calendário.

## Rodando localmente

Backend:

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=controlegastos;Username=gastos_app;Password=..."
dotnet user-secrets set "Jwt:Key" "..."
dotnet user-secrets set "Jwt:Issuer" "ControleGastos"
dotnet user-secrets set "Jwt:Audience" "ControleGastos"
dotnet ef database update
dotnet run
```

Sobe em `http://localhost:5069`. Precisa de um Postgres local rodando com o banco/role já criados.

Frontend:

```bash
cd frontend
npm install
ng serve
```

Abra [http://localhost:4200](http://localhost:4200).

## Funcionalidades

- Registro e login com hash de senha (`PasswordHasher`) e JWT
- CRUD de transações (gasto ou receita), isolado por usuário
- Forma de pagamento (só para gastos) e moeda por transação
- Saldo consolidado no topo da tela, com conversão de moeda via [Frankfurter API](https://frankfurter.dev)
- Componentes de formulário customizados (select e date picker), sem depender de elementos nativos do navegador

## Deploy

Backend na VPS (Docker + Traefik) e frontend no Vercel: [DEPLOY.md](./DEPLOY.md).
