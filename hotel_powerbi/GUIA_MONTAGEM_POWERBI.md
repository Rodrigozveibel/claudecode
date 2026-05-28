# Painel Hotel – Guia de Montagem no Power BI Desktop

## Visão Geral
Este guia mostra como montar o painel de gestão hoteleira usando os arquivos CSV gerados.  
Tempo estimado de montagem: **2–3 horas**.

---

## PASSO 1 – Importar os dados

1. Abra o **Power BI Desktop** → `Página Inicial > Obter Dados > Texto/CSV`
2. Importe os 6 arquivos da pasta `data/` nesta ordem:

| Arquivo                | Tipo       | Descrição                              |
|------------------------|------------|----------------------------------------|
| `reservas.csv`         | Fato       | Cada linha = uma reserva               |
| `faturamento_diario.csv`| Fato      | Receita por dia/reserva                |
| `ocupacao_diaria.csv`  | Fato       | Quartos ocupados por dia               |
| `dim_canais.csv`       | Dimensão   | Canais de venda e % de comissão        |
| `dim_quarto.csv`       | Dimensão   | Tipos de quarto e diária base          |
| `config_hotel.csv`     | Parâmetro  | Total de quartos do hotel              |

3. Em cada arquivo, clique em `Transformar Dados` e ajuste os tipos:
   - Colunas de data → `Data`
   - Colunas de valor → `Número Decimal Fixo`
   - Colunas de texto → `Texto`

---

## PASSO 2 – Criar a Tabela Calendário

1. `Modelagem > Nova Tabela`
2. Cole o código DAX do bloco **"TABELA CALENDÁRIO"** do arquivo `medidas_dax.txt`
3. Renomeie a coluna `[Date]` para `Data` (botão direito na coluna)

---

## PASSO 3 – Relacionamentos (Modelo Estrela)

Vá em `Exibição de Modelo` e crie os relacionamentos abaixo (todos muitos-para-um `*→1`):

```
faturamento_diario[data]          → Calendario[Data]          (ativo)
faturamento_diario[canal]         → dim_canais[canal]          (ativo)
faturamento_diario[tipo_quarto]   → dim_quarto[tipo_quarto]    (ativo)
faturamento_diario[id_reserva]    → reservas[id_reserva]       (ativo)

ocupacao_diaria[data]             → Calendario[Data]           (ativo)

reservas[data_checkin]            → Calendario[Data]           (inativo*)
reservas[canal]                   → dim_canais[canal]          (ativo)
reservas[tipo_quarto]             → dim_quarto[tipo_quarto]    (ativo)
```

> *O relacionamento `reservas[data_checkin] → Calendario` deixe **inativo** para não conflitar.
> Use `USERELATIONSHIP()` nas medidas DAX quando precisar filtrar por data de check-in.

---

## PASSO 4 – Criar as Medidas DAX

1. Crie uma tabela vazia chamada `_Medidas`:  
   `Modelagem > Nova Tabela` → `_Medidas = {0}` → apague a coluna gerada
2. Clique em `_Medidas` no painel de campos → `Nova Medida`
3. Cole cada medida do arquivo `medidas_dax.txt` (uma por vez)

---

## PASSO 5 – Montar as Páginas do Painel

### Página 1 – Dashboard Principal (Visão Geral)

**Layout sugerido:**

```
┌─────────────────────────────────────────────────────────┐
│  FILTROS: Ano | Mês | Canal | Tipo de Quarto            │
├──────────────┬──────────────┬───────────────┬───────────┤
│ Ocupação Mês │ Receita Mês  │ ADR (Ticket)  │ RevPAR    │
│   KPI card   │   KPI card   │   KPI card    │ KPI card  │
├──────────────┴──────────────┴───────────────┴───────────┤
│  Gráfico de linha: Ocupação + Receita ao longo do tempo │
├────────────────────────┬────────────────────────────────┤
│  Donut: Mix de Canais  │  Barra: Receita por Canal      │
└────────────────────────┴────────────────────────────────┘
```

**Visuais:**
- **4 KPI Cards** com seta de tendência:
  - `[Taxa Ocupação %]` vs `[Taxa Ocupação Mês Anterior]`
  - `[Receita Total]` vs `[Receita Total Mês Anterior]`
  - `[ADR]` (ticket médio diária)
  - `[RevPAR]`
- **Gráfico de linha duplo eixo**: eixo X = `Calendario[Ano-Mês]`, linha 1 = `[Taxa Ocupação]`, linha 2 = `[Receita Total]`
- **Gráfico de rosca**: valores = `[% Reservas Canal]`, legenda = `dim_canais[canal]`
- **Gráfico de barras horizontais**: eixo = `dim_canais[canal]`, valor = `[Receita Total]`

---

### Página 2 – Ocupação

**Visuais:**
- **Gráfico de área**: Ocupação diária ao longo do tempo  
  Eixo X: `Calendario[Data]`, Valores: `[Taxa Ocupação]`
- **Heatmap (Matrix)**: Linhas = `Calendario[Nome Mês]`, Colunas = `Calendario[Dia Semana]`, Valores = `[Taxa Ocupação]`  
  → Use formatação condicional para colorir de vermelho (baixo) a verde (alto)
- **Barras agrupadas**: Mês atual vs Mês anterior vs Mesmo período ano anterior  
  Use `[Taxa Ocupação]`, `[Taxa Ocupação Mês Anterior]`, `[Taxa Ocupação Ano Anterior]`
- **Cartões**: `[Variação Ocupação MoM]` e `[Variação Ocupação YoY]`
- **Tabela**: Resumo por mês com Taxa de Ocupação, Quartos Ocupados, ADR, RevPAR

---

### Página 3 – Faturamento

**Visuais:**
- **Gráfico de barras empilhadas** por mês:  
  Valores = `[Receita Hospedagem]`, `[Receita Extras]`, `[Receita Pacotes]`
- **Gráfico de linha**: Receita diária acumulada no mês (MTD) vs projeção
- **Cartões KPI**: Receita Total, Receita Líquida, Total Comissões, Ticket Médio
- **Tabela Detalhada**: Por mês – Receita Bruta, Comissões, Receita Líquida, Variação MoM%
- **Gráfico de cascata (Waterfall)**: Decomposição da receita bruta → comissões → receita líquida

---

### Página 4 – Canais de Venda

**Visuais:**
- **Gráfico de barras 100% empilhadas**: evolução do mix de canais mês a mês
- **Tabela**: Canal | Reservas | % Reservas | Receita | % Receita | Comissão | Receita Líquida
- **Gráfico de dispersão**: Ticket Médio (eixo X) vs Volume de Reservas (eixo Y), pontos = canal
- **Cartões**: `[Receita Direta]`, `[Receita OTAs]`, `[Receita Corporativa]`
- **KPI de comissões**: quanto o hotel paga por canal

---

### Página 5 – Reservas e Hóspedes

**Visuais:**
- **Barras**: Reservas por tipo (Lazer / Corporativa / Evento)
- **Rosca**: Fim de semana vs Dias de semana
- **Linha**: Evolução de reservas mensais com tendência
- **Cartões**: Taxa de Cancelamento, Taxa de No-show, Duração Média de Estadia
- **Tabela**: Detalhamento por tipo de reserva e temporada

---

## PASSO 6 – Filtros Globais (Slicers)

Adicione em todas as páginas via **Sincronizar Slicers**:

| Filtro          | Campo                      | Tipo de visual |
|-----------------|----------------------------|----------------|
| Período         | `Calendario[Data]`         | Intervalo de datas |
| Ano             | `Calendario[Ano]`          | Lista suspensa |
| Mês             | `Calendario[Nome Mês Longo]`| Lista com seleção múltipla |
| Canal           | `dim_canais[canal]`        | Lista |
| Tipo de Quarto  | `dim_quarto[tipo_quarto]`  | Botões |
| Tipo de Reserva | `reservas[tipo_reserva]`   | Botões |

---

## PASSO 7 – Atualização Automática dos Dados

### Opção A – Planilhas locais/rede
1. Salve os CSVs em pasta compartilhada na rede do hotel
2. No Power BI Desktop: altere a fonte para o caminho de rede
3. Publique no **Power BI Service** (gratuito com licença Pro)
4. Configure **Atualização Agendada** (diária ou em tempo real)

### Opção B – Conexão direta ao PMS (Sistema de Gestão Hoteleira)
- Se o PMS exporta para SQL Server, MySQL ou PostgreSQL: use conector nativo do Power BI
- Se o PMS tem API REST: use Power Query (M) para consumir a API
- Se exporta para Excel: aponte o Power BI para o arquivo Excel compartilhado

### Opção C – Google Sheets como fonte intermediária
1. Exporte do PMS para Google Sheets (muitos PMS suportam)
2. Use o conector "Google Sheets" no Power BI (via Web connector)
3. Configure atualização agendada no Power BI Service

---

## Dicas de Design Gerencial

- **Cores sugeridas**: Azul escuro `#1B3A6B` (primário), Dourado `#C9A84C` (destaque), Cinza `#F5F5F5` (fundo)
- **Fonte**: Segoe UI (padrão Power BI) – legível em telas gerenciais
- **Regra dos 3 cliques**: qualquer informação deve ser acessível em no máximo 3 cliques
- **Mobile layout**: ative `Exibição > Layout Móvel` para cada página para uso no celular
- **Marcadores**: use para criar botões de navegação entre páginas sem a barra lateral

---

## Arquivos Gerados

```
hotel_powerbi/
├── data/
│   ├── reservas.csv            ← 11.933 reservas (Jan/2024 – Mai/2026)
│   ├── faturamento_diario.csv  ← 30.955 linhas de receita diária
│   ├── ocupacao_diaria.csv     ← 879 dias de ocupação
│   ├── dim_canais.csv          ← 6 canais de venda
│   ├── dim_quarto.csv          ← 3 tipos de quarto
│   └── config_hotel.csv        ← Parâmetros do hotel (50 quartos)
├── generate_data.py            ← Script para regenerar dados
└── medidas_dax.txt             ← Todas as fórmulas DAX prontas
```
