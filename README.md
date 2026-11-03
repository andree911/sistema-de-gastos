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

## Direcao do produto

O projeto esta evoluindo de um controle de gastos para um acompanhante de rotina pessoal. A rotina sera o nucleo que conecta estudos, saude, financas e objetivos, sem remover as funcionalidades financeiras existentes.

### Camadas do MVP

1. **Rotina** - atividades do dia, habitos, tarefas e progresso.
2. **Objetivos** - metas pessoais, academicas, de saude e financeiras.
3. **Registros** - gastos, sessoes de estudo, refeicoes, exercicios e outros dados.
4. **Insights** - resumos e recomendacoes baseados na rotina.

### MVP implementado

- **Rotina v1:** cadastro de atividades diarias com titulo e categoria (Pessoal, Estudos, Saude ou Financas).
- Lista de atividades isolada por usuario, com conclusao, remocao e indicador de progresso do dia.
- Nova tela inicial autenticada em `/rotina`, mantendo o modulo de transacoes em `/transacoes`.
- **Estudos v1:** trilha de aulas completas sobre metodos de estudo, com referencias para fontes confiaveis.
- Planos de estudo por usuario, metas semanais, registro de sessoes e progresso de aulas.

### Proximas etapas

- Adicionar habitos recorrentes e historico semanal a rotina.
- Expandir a biblioteca de cursos com curadoria por tema e referencias.
- Integrar os planos e sessoes de estudo a rotina diaria.
- Adicionar registros manuais de sono, passos e treinos.
- Criar um painel unificado de progresso e insights.
- Criar painel de insights diarios e semanais.
- Preparar o produto como PWA/app mobile.

## Deploy

Frontend na Vercel: [frontend-sandy-eight-67.vercel.app](https://frontend-sandy-eight-67.vercel.app). API na VPS: [srv1892430.hstgr.cloud:3029](https://srv1892430.hstgr.cloud:3029). Ambos responderam na última verificação. O processo de deploy está em [DEPLOY.md](./DEPLOY.md).
