# PMS Backend

Fase 1 (Fundações) do roadmap: API REST com autenticação e CRUD de Quartos,
Hóspedes e Reservas, com regra de disponibilidade (sem sobreposição de datas
por quarto).

Persistência atual: repositórios em memória (`src/repositories`), atrás de uma
interface simples (`InMemoryRepository`) para permitir trocar por Postgres
sem alterar services/controllers.

## Rodando localmente

```bash
cp .env.example .env
npm install
npm run dev
```

## Testes

```bash
npm test              # roda a suíte
npm run test:coverage # com relatório de cobertura (thresholds em jest.config.js)
```

- `tests/unit`: regras de negócio dos services (validação, conflitos de reserva, auth).
- `tests/integration`: rotas HTTP via supertest, exercitando app + middlewares.

## Próximos passos de teste (ver roadmap)

- Trocar o repositório em memória por um repositório Postgres com testes de
  integração contra um banco real (ex. via `testcontainers` ou serviço do CI).
- Testes de carga/contenção para reservas concorrentes no mesmo quarto.
- Testes de contrato para as futuras integrações com OTAs (Booking, Airbnb).
