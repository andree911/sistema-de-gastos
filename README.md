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

### Planejamento de estudos

- Cada plano pode conter matérias e tópicos com data prevista opcional.
- Tópicos têm os estados A estudar, Em andamento e Concluído.
- Registrar estudo em um tópico vincula a sessão ao plano e acumula tempo e quantidade de sessões.
- A primeira sessão inicia o tópico; a conclusão é marcada pelo usuário.
- Excluir uma matéria ou tópico preserva as sessões no histórico.
- O organizador permite criar tópicos próprios e explorar assuntos relacionados no Tesauro da UNESCO, guardando a referência da origem ao adicioná-los ao plano.
- O tesauro oferece uma classificação multidisciplinar para descoberta e organização; não é currículo e não determina prioridade nem dificuldade de estudo.
- Os termos exibidos do Tesauro da UNESCO são atribuídos à fonte e identificados sob a licença CC BY-SA 3.0 IGO. A busca e os subtemas dependem da API externa; tópicos já adicionados ao plano permanecem salvos no banco do usuário.
- A migração `AddCatalogoTemasEstudo` adiciona a origem dos tópicos. Aplique as migrações com `dotnet ef database update` em cada ambiente antes de executar esta versão da API.

### Acompanhamento da rotina

- Navegação por data e semana, com contagem de atividades concluídas por dia.
- Progresso diário, resumo semanal e filtros de atividades pendentes e concluídas.
- Edição, conclusão, reabertura e adiamento para o dia seguinte sem duplicar a atividade.
- Tópicos de estudo com data prevista aparecem na rotina, com acesso à área de estudos.
- Esta etapa acompanha atividades individuais; hábitos recorrentes e sequências de dias ficam para uma próxima entrega.

### Saúde e bem-estar

- Diário por data com sono, passos, disposição e observações opcionais.
- Registros de água (ml), refeições (calorias opcionais informadas pelo usuário) e exercícios (minutos).
- Edição, exclusão e histórico de sete dias com resumo integrado à rotina.
- Registros manuais, isolados por usuário. Sem estimativas automáticas de calorias ou sincronização com dispositivos nesta etapa.
- A migração `AddDiarioSaude` deve ser aplicada antes de executar a API neste ambiente.

### Contador nutricional

- Busca por nome via USDA FoodData Central, seleção de gramas ou porções fornecidas pela fonte e montagem de refeições com vários alimentos.
- Cálculo no servidor de calorias, proteínas, carboidratos e gorduras, com cópia dos valores por 100 g em cada item para preservar o histórico.
- Edição das quantidades usa os valores salvos. Refeições antigas sem alimentos detalhados continuam disponíveis.
- Fonte: [USDA FoodData Central](https://fdc.nal.usda.gov/), dados [CC0](https://fdc.nal.usda.gov/api-guide/). A busca, os nomes e as porções seguem o idioma escolhido na conta (pt-BR ou en-US), mantendo os nomes originais disponíveis para conferência.
- Tradução automática de termos alimentares via [MyMemory](https://mymemory.translated.net/doc/spec.php), com cache persistente em `TraducoesNutricionais`. Somente os termos da busca e as descrições públicas dos alimentos/porções são traduzidos; notas pessoais e dados de consumo não são enviados para tradução. Se indisponível, preserva o original e informa isso na busca.
- A tradução gratuita tem limite de 5.000 caracteres/dia. `Nutrition__TranslationEmail` pode ser configurado pelo operador para a faixa de uso descrita na documentação do provedor; nenhum e-mail da conta do usuário é enviado automaticamente.
- Aplicar também a migração `AddTraducoesNutricionais` antes de executar esta versão.
- Em desenvolvimento, sem chave configurada, usa `DEMO_KEY` pública (30 consultas/hora e 50/dia por IP). Para uso contínuo, configure `Nutrition:UsdaApiKey` em User Secrets ou `Nutrition__UsdaApiKey` no ambiente do backend. A chave não vai para o frontend.
- A migração `AddAlimentosRefeicao` deve ser aplicada antes de executar esta versão da API. Sem leitura de código de barras nesta entrega.

### Próximos passos

- Adicionar habitos recorrentes e historico semanal a rotina.
- Expandir a biblioteca de cursos com curadoria por tema e referencias.
- Integrar os planos e sessoes de estudo a rotina diaria.
- Adicionar registros manuais de sono, passos e treinos.
- Criar um painel unificado de progresso e insights.
- Criar painel de insights diarios e semanais.
- Preparar o produto como PWA/app mobile.

## Deploy

Frontend na Vercel: [frontend-sandy-eight-67.vercel.app](https://frontend-sandy-eight-67.vercel.app). API na VPS: [srv1892430.hstgr.cloud:3029](https://srv1892430.hstgr.cloud:3029). Ambos responderam na última verificação. O processo de deploy está em [DEPLOY.md](./DEPLOY.md).
