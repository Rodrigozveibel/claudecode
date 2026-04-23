# Hotel PMS - Sistema de Gestão Hoteleira

Sistema completo de gestão hoteleira inspirado em Cloudbeds e Omnibees, com todas as funcionalidades essenciais para a operação de um hotel moderno.

---

## Módulos do Sistema

### Recepção & Front Desk
- Check-in e Check-out digital
- Visão em tempo real dos hóspedes no hotel
- Atribuição automática de quartos

### Motor de Reservas
- Reservas diretas (website do hotel)
- Calendário de disponibilidade interativo
- Cálculo automático de tarifas
- Confirmação por e-mail automática

### Gerenciador de Canais (Channel Manager)
- Integração com Booking.com, Expedia, Airbnb, Hotels.com
- Sincronização automática de inventário e tarifas
- Prevenção de overbooking

### Gestão de Quartos
- Status em tempo real (Disponível, Ocupado, Limpeza, Manutenção)
- Tipos de quarto com fotos e amenidades
- Mapa de andares visual

### Gestão de Hóspedes
- Perfil completo do hóspede
- Histórico de hospedagens
- Preferências e notas
- Programa de fidelidade (pontos)
- Blacklist de hóspedes problemáticos

### Governança (Housekeeping)
- Quadro Kanban de tarefas de limpeza
- Atribuição automática pós-checkout
- Inspeção de quartos
- Relatório de produtividade

### Faturamento & Pagamentos
- Geração automática de faturas
- Múltiplos métodos de pagamento (cartão, dinheiro, PIX, transferência)
- Reembolsos
- Exportação para contabilidade

### Revenue Management
- Dashboard de métricas (ADR, RevPAR, Ocupação)
- Regras de tarifas (temporada, fim de semana, promoção)
- Calendário de tarifas
- Sugestões de yield management

### Relatórios & Analytics
- Relatório de ocupação
- Relatório de receita
- Análise por canal de distribuição
- Relatório de hóspedes
- Resumo financeiro
- Exportação CSV

### Manutenção
- Abertura de chamados de manutenção
- Atribuição de técnicos
- Histórico por quarto
- Relatório de manutenção

### CRM & Comunicação
- Envio de mensagens para hóspedes (e-mail, SMS, WhatsApp)
- Templates de mensagens
- Mensagens automáticas (pré-chegada, pós-estadia)
- Histórico de conversas

### Gestão de Equipe
- Cadastro de funcionários
- Controle de papéis e permissões
- Gestão de tarefas

---

## Stack Tecnológico

### Backend
| Tecnologia | Uso |
|------------|-----|
| Node.js 20 + TypeScript | Runtime e linguagem |
| Express.js | Framework web |
| Prisma ORM | Banco de dados |
| PostgreSQL 16 | Banco relacional |
| Redis 7 | Cache e sessões |
| Socket.io | Comunicação em tempo real |
| JWT | Autenticação |
| Zod | Validação de dados |
| Nodemailer | Envio de e-mails |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 18 + TypeScript | Framework UI |
| Vite | Build tool |
| Tailwind CSS | Estilização |
| React Router v6 | Roteamento |
| TanStack Query v5 | Gerenciamento de estado servidor |
| Zustand | Estado global |
| Recharts | Gráficos |
| FullCalendar | Calendário de reservas |
| React Hook Form + Zod | Formulários |
| Lucide React | Ícones |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Docker + Docker Compose | Containerização |
| Nginx | Reverse proxy |
| GitHub Actions | CI/CD |

---

## Início Rápido

### Pré-requisitos
- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- Git

### Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repo-url>
cd hotel-pms

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Suba todos os serviços
docker-compose up -d

# Acesse o sistema
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
```

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp ../.env.example .env
# Edite o .env
npx prisma migrate dev
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
cp ../.env.example .env
npm run dev
```

### Credenciais Padrão (desenvolvimento)

```
Email: admin@hotel.com
Senha: Admin@123
```

---

## Estrutura do Projeto

```
hotel-pms/
├── backend/                 # API Node.js + Express
│   ├── prisma/             # Schema e migrations do banco
│   └── src/
│       ├── config/         # Configurações
│       ├── middleware/      # Middlewares Express
│       ├── modules/        # Módulos do sistema
│       └── utils/          # Utilitários
├── frontend/               # App React
│   └── src/
│       ├── api/            # Chamadas à API
│       ├── components/     # Componentes reutilizáveis
│       ├── pages/          # Páginas do sistema
│       ├── store/          # Estado global (Zustand)
│       └── types/          # Tipos TypeScript
├── nginx/                  # Configuração Nginx
├── docker-compose.yml      # Orquestração de containers
└── .env.example            # Variáveis de ambiente
```

---

## Módulos da API

| Módulo | Endpoints Base |
|--------|---------------|
| Autenticação | `/api/auth` |
| Propriedades | `/api/properties` |
| Tipos de Quarto | `/api/room-types` |
| Quartos | `/api/rooms` |
| Hóspedes | `/api/guests` |
| Reservas | `/api/reservations` |
| Check-in/out | `/api/checkin` |
| Governança | `/api/housekeeping` |
| Faturamento | `/api/billing` |
| Revenue | `/api/revenue` |
| Canais | `/api/channels` |
| Relatórios | `/api/reports` |
| Equipe | `/api/staff` |
| Manutenção | `/api/maintenance` |
| Notificações | `/api/notifications` |
| CRM | `/api/crm` |

---

## Papéis e Permissões

| Papel | Acesso |
|-------|--------|
| SUPER_ADMIN | Acesso total a todas as propriedades |
| ADMIN | Acesso total à propriedade |
| MANAGER | Gerenciamento operacional |
| FRONT_DESK | Recepção, reservas, check-in/out |
| HOUSEKEEPING | Tarefas de limpeza |
| MAINTENANCE | Chamados de manutenção |
| ACCOUNTANT | Faturamento e relatórios financeiros |

---

## Roadmap

- [ ] App Mobile (React Native)
- [ ] Integração com fechaduras eletrônicas
- [ ] Check-in self-service (QR Code)
- [ ] IA para precificação dinâmica
- [ ] Previsão de demanda com ML
- [ ] Programa de fidelidade avançado
- [ ] Multi-idioma (EN, ES, PT)
- [ ] Marketplace de serviços

---

**Status:** 🟢 Em Desenvolvimento  
**Versão:** 1.0.0  
**Última Atualização:** 2026-04-23
