"""
Gerador de dados de amostra para o painel Power BI do Hotel.
Gera ~2 anos de dados realistas (Jan/2024 a Mai/2026).
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

np.random.seed(42)
random.seed(42)

# ── Configurações do hotel ──────────────────────────────────────────────────
TOTAL_QUARTOS = 50
START_DATE = datetime(2024, 1, 1)
END_DATE   = datetime(2026, 5, 28)

CANAIS = {
    'Direta':              {'peso': 0.22, 'comissao': 0.00},
    'Booking.com':         {'peso': 0.32, 'comissao': 0.15},
    'Expedia':             {'peso': 0.14, 'comissao': 0.18},
    'Airbnb':              {'peso': 0.10, 'comissao': 0.14},
    'Corporativa':         {'peso': 0.14, 'comissao': 0.08},
    'Agência de Viagem':   {'peso': 0.08, 'comissao': 0.12},
}

TIPOS_QUARTO = {
    'Standard': {'peso': 0.50, 'diaria_base': 280},
    'Superior': {'peso': 0.35, 'diaria_base': 380},
    'Luxo':     {'peso': 0.15, 'diaria_base': 550},
}

TIPOS_RESERVA = {
    'Lazer':      0.55,
    'Corporativa': 0.30,
    'Evento':     0.15,
}

STATUS_DIST = {'Confirmada': 0.88, 'Cancelada': 0.08, 'No-show': 0.04}

# ── Helpers ─────────────────────────────────────────────────────────────────

def weighted_choice(d):
    items  = list(d.keys())
    weights = [v['peso'] if isinstance(v, dict) else v for v in d.values()]
    return random.choices(items, weights=weights, k=1)[0]

def sazonalidade(data: datetime) -> float:
    """Multiplicador de ocupação por época do ano."""
    mes = data.month
    fds = data.weekday() >= 4  # qui-dom
    base = {
        1: 0.55, 2: 0.60, 3: 0.72, 4: 0.78,
        5: 0.75, 6: 0.85, 7: 1.00, 8: 0.95,
        9: 0.70, 10: 0.75, 11: 0.65, 12: 0.90,
    }[mes]
    return min(base * (1.20 if fds else 1.0), 1.0)

def variacao_tarifa(data: datetime, tipo_quarto: str) -> float:
    """Variação de preço por sazonalidade + crescimento YoY."""
    mult_sazon = 0.85 + (sazonalidade(data) * 0.30)
    mult_ano   = 1.0 + 0.06 * ((data.year - 2024) + (data.month - 1) / 12)
    ruido      = np.random.uniform(0.93, 1.07)
    return TIPOS_QUARTO[tipo_quarto]['diaria_base'] * mult_sazon * mult_ano * ruido

# ── Geração de reservas ──────────────────────────────────────────────────────

def gerar_reservas():
    reservas = []
    id_res = 1000

    data = START_DATE
    while data <= END_DATE:
        ocup_alvo = sazonalidade(data)
        quartos_disponiveis = TOTAL_QUARTOS
        quartos_ocupados = 0

        # Número de check-ins neste dia (reservas que iniciam hoje)
        novos_checkins = int(TOTAL_QUARTOS * ocup_alvo * np.random.uniform(0.25, 0.45))

        for _ in range(novos_checkins):
            if quartos_ocupados >= quartos_disponiveis:
                break

            canal        = weighted_choice(CANAIS)
            tipo_quarto  = weighted_choice(TIPOS_QUARTO)
            tipo_reserva = weighted_choice(TIPOS_RESERVA)
            status       = weighted_choice(STATUS_DIST)

            # Duração da estadia
            if tipo_reserva == 'Corporativa':
                diarias = random.choices([1, 2, 3, 4, 5], weights=[25, 35, 20, 12, 8])[0]
            elif tipo_reserva == 'Evento':
                diarias = random.choices([2, 3, 4, 5, 7], weights=[15, 25, 30, 20, 10])[0]
            else:
                diarias = random.choices([1, 2, 3, 4, 5, 7, 10], weights=[20, 28, 22, 15, 8, 5, 2])[0]

            checkout = data + timedelta(days=diarias)
            if checkout > END_DATE + timedelta(days=30):
                checkout = END_DATE + timedelta(days=1)
                diarias  = (checkout - data).days

            valor_diaria     = round(variacao_tarifa(data, tipo_quarto), 2)
            valor_hospedagem = round(valor_diaria * diarias, 2)

            # Extras e pacotes (apenas confirmadas)
            if status == 'Confirmada':
                valor_extras   = round(valor_hospedagem * np.random.uniform(0.02, 0.12), 2)
                valor_pacotes  = round(valor_hospedagem * np.random.uniform(0.0,  0.15)
                                       if random.random() < 0.35 else 0, 2)
            else:
                valor_extras  = 0.0
                valor_pacotes = 0.0

            comissao_pct   = CANAIS[canal]['comissao']
            valor_comissao = round(valor_hospedagem * comissao_pct, 2)
            valor_liquido  = round(valor_hospedagem - valor_comissao + valor_extras + valor_pacotes, 2)

            # Alta/baixa temporada
            temporada = 'Alta' if data.month in (1, 7, 8, 12) or (data.month == 12 and data.day >= 15) else 'Baixa'
            fds_checkin = 'Fim de Semana' if data.weekday() >= 4 else 'Semana'

            reservas.append({
                'id_reserva':        id_res,
                'data_reserva':      (data - timedelta(days=random.randint(0, 45))).strftime('%Y-%m-%d'),
                'data_checkin':      data.strftime('%Y-%m-%d'),
                'data_checkout':     checkout.strftime('%Y-%m-%d'),
                'num_diarias':       diarias,
                'num_hospedes':      random.randint(1, 4),
                'canal':             canal,
                'tipo_quarto':       tipo_quarto,
                'tipo_reserva':      tipo_reserva,
                'status':            status,
                'temporada':         temporada,
                'fds_checkin':       fds_checkin,
                'valor_diaria':      valor_diaria,
                'valor_hospedagem':  valor_hospedagem,
                'valor_extras':      valor_extras,
                'valor_pacotes':     valor_pacotes,
                'valor_comissao':    valor_comissao,
                'valor_liquido':     valor_liquido,
            })

            quartos_ocupados += 1
            id_res += 1

        data += timedelta(days=1)

    return pd.DataFrame(reservas)

# ── Faturamento diário (granularidade por dia de estadia) ────────────────────

def gerar_faturamento_diario(df_reservas: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, r in df_reservas[df_reservas['status'] == 'Confirmada'].iterrows():
        checkin  = datetime.strptime(r['data_checkin'],  '%Y-%m-%d')
        checkout = datetime.strptime(r['data_checkout'], '%Y-%m-%d')
        dias     = max((checkout - checkin).days, 1)

        for d in range(dias):
            dia = checkin + timedelta(days=d)
            if dia >= START_DATE and dia <= END_DATE:
                rows.append({
                    'id_reserva':       r['id_reserva'],
                    'data':             dia.strftime('%Y-%m-%d'),
                    'canal':            r['canal'],
                    'tipo_quarto':      r['tipo_quarto'],
                    'tipo_reserva':     r['tipo_reserva'],
                    'valor_hospedagem': round(r['valor_hospedagem'] / dias, 2),
                    'valor_extras':     round(r['valor_extras']     / dias, 2),
                    'valor_pacotes':    round(r['valor_pacotes']    / dias, 2),
                    'valor_comissao':   round(r['valor_comissao']   / dias, 2),
                    'valor_liquido':    round(r['valor_liquido']    / dias, 2),
                })
    return pd.DataFrame(rows)

# ── Ocupação diária ──────────────────────────────────────────────────────────

def gerar_ocupacao_diaria(df_fat: pd.DataFrame) -> pd.DataFrame:
    if df_fat.empty:
        return pd.DataFrame()
    ocup = (df_fat.groupby('data')
                  .agg(quartos_ocupados=('id_reserva', 'nunique'))
                  .reset_index())
    ocup['total_quartos']    = TOTAL_QUARTOS
    ocup['taxa_ocupacao']    = (ocup['quartos_ocupados'] / TOTAL_QUARTOS).round(4)
    ocup['quartos_disponiveis'] = TOTAL_QUARTOS - ocup['quartos_ocupados']

    # Adiciona dia da semana e mês para facilitar filtros no Power BI
    ocup['data']       = pd.to_datetime(ocup['data'])
    ocup['ano']        = ocup['data'].dt.year
    ocup['mes']        = ocup['data'].dt.month
    ocup['nome_mes']   = ocup['data'].dt.strftime('%b')
    ocup['dia_semana'] = ocup['data'].dt.day_name()
    ocup['fds']        = ocup['data'].dt.weekday.isin([4, 5, 6]).map({True: 'Fim de Semana', False: 'Semana'})
    ocup['data']       = ocup['data'].dt.strftime('%Y-%m-%d')
    return ocup

# ── Tabelas dimensão ─────────────────────────────────────────────────────────

def gerar_dim_canais() -> pd.DataFrame:
    rows = []
    for canal, info in CANAIS.items():
        tipo = ('OTA' if canal in ('Booking.com', 'Expedia', 'Airbnb')
                else 'Corporativa' if canal == 'Corporativa'
                else 'Agência' if canal == 'Agência de Viagem'
                else 'Direta')
        rows.append({'canal': canal, 'tipo_canal': tipo, 'comissao_pct': info['comissao']})
    return pd.DataFrame(rows)

def gerar_dim_quarto() -> pd.DataFrame:
    return pd.DataFrame([
        {'tipo_quarto': 'Standard', 'diaria_base': 280, 'capacidade_max': 2},
        {'tipo_quarto': 'Superior', 'diaria_base': 380, 'capacidade_max': 3},
        {'tipo_quarto': 'Luxo',     'diaria_base': 550, 'capacidade_max': 4},
    ])

def gerar_config_hotel() -> pd.DataFrame:
    return pd.DataFrame([{'chave': 'total_quartos', 'valor': str(TOTAL_QUARTOS)}])

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    out = '/home/user/claudecode/hotel_powerbi/data'
    os.makedirs(out, exist_ok=True)

    print('Gerando reservas...')
    df_res = gerar_reservas()
    df_res.to_csv(f'{out}/reservas.csv', index=False)
    print(f'  {len(df_res):,} reservas geradas.')

    print('Gerando faturamento diário...')
    df_fat = gerar_faturamento_diario(df_res)
    df_fat.to_csv(f'{out}/faturamento_diario.csv', index=False)
    print(f'  {len(df_fat):,} linhas de faturamento.')

    print('Gerando ocupação diária...')
    df_ocup = gerar_ocupacao_diaria(df_fat)
    df_ocup.to_csv(f'{out}/ocupacao_diaria.csv', index=False)
    print(f'  {len(df_ocup):,} dias.')

    print('Gerando dimensões...')
    gerar_dim_canais().to_csv(f'{out}/dim_canais.csv', index=False)
    gerar_dim_quarto().to_csv(f'{out}/dim_quarto.csv', index=False)
    gerar_config_hotel().to_csv(f'{out}/config_hotel.csv', index=False)

    print('\nArquivos gerados em:', out)
    print(df_res[['canal', 'tipo_quarto', 'status', 'valor_hospedagem']].describe(include='all').to_string())

if __name__ == '__main__':
    main()
