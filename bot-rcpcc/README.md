# Robô de triagem RCPCC (revisional de contrato bancário) no Digisac

Atende leads no WhatsApp pelo Digisac, 24h por dia: entende o caso, **lê foto ou PDF do contrato**, **calcula a taxa
real e compara com a média do Banco Central** da modalidade no mês da contratação, dá uma nota ao lead e **só marca
reunião com quem tem potencial**. Ouve áudio (transcrição) e responde em áudio (opcional). Leads urgentes
(busca e apreensão) vão direto para você.

## Como funciona

```
Lead (WhatsApp) -> Digisac -> webhook -> este servidor
                                       |- agrupa mensagens seguidas (8s)
                                       |- áudio -> texto (Groq Whisper)
                                       |- foto/PDF do contrato -> Claude lê
                                       |- Claude conversa + ferramentas:
                                       |     analisar_taxa   (API do BACEN, séries SGS)
                                       |     registrar_lead  (nota 0-100 calculada em código, app/score.py)
                                       |     consultar_horarios / agendar_reuniao (Google Agenda)
                                       |     transferir_humano / encerrar_atendimento
                                       '- resposta -> Digisac (texto ou áudio)
```

- **Quente** (nota >= 55, ou busca e apreensão): oferece reunião e agenda.
- **Morno** (35 a 54): pede o que falta (normalmente o contrato).
- **Frio / desqualificado**: diz com honestidade que provavelmente não compensa e encerra. Se for superendividamento,
  passa para a equipe (Lei 14.181/2021).
- Quando alguém da equipe responde no ticket, o robô **fica calado por 12h** naquele contato.
- Follow-up automático 3h e 20h depois, se o lead sumir (dentro da janela de 24h do WhatsApp, das 8h às 21h).
- Regras da OAB (Provimento 205/2021) estão no prompt: não promete resultado, não fala de honorários, não orienta
  parar de pagar e se apresenta como assistente virtual.

## Treinar o robô (sua parte)

Tudo o que estiver em `knowledge/*.md` entra no "cérebro" do robô. Já vêm 3 arquivos:
- `01_escritorio.md` -> **preencha** (endereço, política de honorários, nº OAB).
- `02_teses_bancario.md` -> súmulas e temas do STJ usados na triagem.
- `03_faq.md` -> respostas padrão.

Para acrescentar material (artigos, roteiro de vendas, decisões do seu TJ), crie novos `.md` nessa pasta e reinicie.
Prefira resumo objetivo a colar 300 páginas de PDF: o robô decide melhor com regras claras.

A **régua de pontuação** fica em `app/score.py`. Ajuste os pesos depois de 30 a 50 leads, olhando quais viraram contrato.

## Passo a passo para colocar no ar

### 1. Contas (custo mensal aproximado)
| Item | Para quê | Custo |
|---|---|---|
| Anthropic API (console.anthropic.com) | o cérebro | ~R$2 a R$6 por lead triado (Claude Opus 5.5) |
| Servidor VPS (Hetzner, DigitalOcean, Hostinger, Contabo) 2 GB RAM | ficar 24h no ar | R$30 a R$60 |
| Domínio/subdomínio (ex.: robo.seudominio.com.br) | URL https do webhook | já tem o do escritório |
| Groq (console.groq.com) - opcional | ouvir áudio | centavos por mês |
| ElevenLabs - opcional | mandar áudio | ~US$5 a US$22 |

### 2. No Digisac
1. Configurações > API: gere um **token**.
2. Descubra o ID da conexão de WhatsApp e do departamento (rode o diagnóstico do passo 4, ele lista).
3. Configurações > Webhooks: crie um webhook para o evento **Mensagem criada (message.created)** apontando para
   `https://robo.SEUDOMINIO.com.br/webhook/digisac?secret=SEU_WEBHOOK_SECRET`.
4. Desligue o chatbot/URA nativo do Digisac nessa conexão, senão os dois respondem.

### 3. No servidor (Ubuntu)
```bash
curl -fsSL https://get.docker.com | sh
```
```bash
git clone <este repositório> && cd claudecode/bot-rcpcc
```
```bash
cp .env.example .env && nano .env
```
Edite `Caddyfile` com seu subdomínio e aponte o DNS (registro A) do subdomínio para o IP do servidor.
```bash
docker compose up -d --build
```
`restart: always` faz o robô voltar sozinho se cair ou se o servidor reiniciar. O Caddy gera o HTTPS sozinho.

### 4. Testar
```bash
docker compose exec robo python -m app.diagnostico
```
```bash
docker compose exec robo python -m app.simulador
```
O simulador deixa você conversar com o robô no terminal, fazendo papel de lead, sem mexer no Digisac.
Teste pelo menos: lead bom de veículo, lead com juros na média, lead com busca e apreensão, lead que pergunta
"vou ganhar?", lead que manda áudio.

Leads e notas: `https://robo.SEUDOMINIO.com.br/leads?secret=SEU_WEBHOOK_SECRET`

Logs ao vivo:
```bash
docker compose logs -f robo
```

### 5. Agenda Google (opcional, recomendado)
1. Google Cloud Console > crie projeto > ative "Google Calendar API" > crie uma **conta de serviço** > baixe a chave JSON.
2. Salve como `data/google-sa.json`.
3. No Google Agenda, compartilhe sua agenda com o e-mail da conta de serviço com permissão
   "Fazer alterações nos eventos".
4. Preencha `GOOGLE_CALENDAR_ID` (seu e-mail) e `LINK_REUNIAO_ONLINE` no `.env`.

Sem isso, o robô coleta dia/turno preferido e avisa você para confirmar manualmente.

## O que precisa ser confirmado antes de ligar para valer
- **Endpoints de envio do Digisac** (`/messages`, `/contacts/{id}/ticket/transfer`): o formato do webhook foi
  confirmado; os de envio seguem a API v1 pública, mas a versão da sua conta pode diferir. O `app.diagnostico` e um
  teste com seu próprio número resolvem.
- **Séries BACEN** 25467 (consignado público) e 25478 (cartão parcelado): conferir no SGS. As demais foram conferidas.
- Se a conexão do Digisac for a **API oficial da Meta**, mensagens depois de 24h sem resposta do lead exigem template
  aprovado; o follow-up automático já respeita essa janela.

## Rodar os testes
```bash
pip install -r requirements.txt && python -m pytest -q
```
