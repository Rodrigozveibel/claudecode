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
    # O que fazer com quem NÃO veio do criativo: "triagem" (robô tria e encaminha) ou "silencio" (não responde).
    outras_areas_modo: str = "triagem"
    # JSON área -> ID do departamento no Digisac. Ex.: {"consumidor":"uuid","trabalhista":"uuid"}
    departamentos_por_area: str = "{}"

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

    nome_escritorio: str = "Escritório"
    nome_advogado: str = "o advogado"
    nome_assistente: str = "Ana"

    def lista(self, campo: str) -> list[str]:
        return [x.strip() for x in getattr(self, campo).split(",") if x.strip()]

    def departamentos(self) -> dict:
        import json
        try:
            return json.loads(self.departamentos_por_area or "{}")
        except ValueError:
            return {}

    db_path: str = "data/bot.db"
    # segundos esperando o lead terminar de digitar várias mensagens seguidas
    debounce_segundos: float = 8.0
    # horas que o robô fica calado depois que um humano responde no ticket
    pausa_humano_horas: int = 12


@lru_cache
def settings() -> Settings:
    return Settings()
