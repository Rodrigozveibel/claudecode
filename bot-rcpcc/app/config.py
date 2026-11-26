from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    claude_model: str = "claude-opus-5-5"
    claude_effort: str = "medium"

    digisac_api_url: str = ""
    digisac_token: str = ""
    digisac_service_id: str = ""
    digisac_departamento_advogado_id: str = ""
    webhook_secret: str = ""

    advogado_whatsapp: str = ""

    # ===== Origem do lead: quando o robô entra no fluxo RCPCC =====
    # Conexões (serviceId) dedicadas à campanha RCPCC: tudo que chega nelas é RCPCC.
    rcpcc_service_ids: str = ""
    # Texto pré-preenchido do link do anúncio / palavras-chave (separadas por vírgula, sem acento/maiúscula).
    rcpcc_gatilhos: str = "#rcpcc,revisar meu contrato,revisao de contrato,revisional,juros abusivos,juros altos"
    # IDs de anúncios do Meta (Click-to-WhatsApp), se o Digisac repassar o referral no webhook.
    rcpcc_ad_ids: str = ""
    # Quem NÃO veio do criativo: "filtro" (1 pergunta; bancário fica, resto vai p/ atendimento) ou "silencio".
    outras_areas_modo: str = "filtro"
    # Departamento do Digisac que recebe os assuntos não bancários
    digisac_departamento_atendimento_id: str = ""

    groq_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    google_service_account_json: str = ""
    google_calendar_id: str = ""
    link_agendamento_fallback: str = ""
    link_reuniao_online: str = ""
    horario_inicio: int = 9
    horario_fim: int = 18
    duracao_reuniao_min: int = 30
    fuso: str = "America/Sao_Paulo"

    nome_escritorio: str = "R Zveibel Advogados"
    nome_advogado: str = "Dr. Rodrigo Zveibel"
    nome_assistente: str = "Dani"

    # ===== Honorários (funil de fechamento no WhatsApp). 0 = desligado: o robô não cita valores. =====
    honorarios_inicial_pct: float = 0.0        # % da dívida (funil sugere 5 a 10)
    honorarios_inicial_minimo: float = 0.0     # piso dos honorários iniciais em R$
    honorarios_exito_pct: float = 0.0          # % da redução obtida (funil sugere 7 a 10)
    honorarios_entrada_pct: float = 19.0       # entrada no boleto (% do total)
    honorarios_parcelas_boleto: int = 10
    honorarios_parcelas_cartao: int = 10
    honorarios_acrescimo_cartao_pct: float = 7.5
    honorarios_desconto_avista_pct: float = 15.0
    # follow-up depois de 24h sem resposta só funciona em WhatsApp não oficial ou com template aprovado
    followup_fora_janela_24h: bool = False

    def lista(self, campo: str) -> list[str]:
        return [x.strip() for x in getattr(self, campo).split(",") if x.strip()]


    db_path: str = "data/bot.db"
    # segundos esperando o lead terminar de digitar várias mensagens seguidas
    debounce_segundos: float = 8.0
    # horas que o robô fica calado depois que um humano responde no ticket
    pausa_humano_horas: int = 12


@lru_cache
def settings() -> Settings:
    return Settings()
