/**
 * Ponto de entrada do bot
 * – Recebe webhooks da Z-API
 * – Processa com IA
 * – Responde via Z-API
 */
import express from "express";
import { config } from "./config";
import { parsearWebhook, webhookValido, enviarTexto } from "./zapi";
import { responder } from "./ai";
import {
  adicionarMensagem,
  obterHistorico,
  estaEmControleHumano,
  setControleHumano,
} from "./conversa";
import { buscarReservaPorTelefone } from "./simples";

const app = express();
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ status: "online", hotel: config.hotel.nome, hora: new Date().toISOString() });
});

// ─── Webhook principal (Z-API) ────────────────────────────────────────────────

app.post("/webhook", async (req, res) => {
  // Valida token de segurança
  const clientToken = req.headers["client-token"] as string | undefined;
  if (!webhookValido(clientToken)) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  // Responde 200 imediatamente para a Z-API não reenviar
  res.sendStatus(200);

  const msg = parsearWebhook(req.body);
  if (!msg || !msg.texto || !msg.telefone) return;

  const { telefone, nome, texto } = msg;

  console.log(`[${new Date().toLocaleTimeString("pt-BR")}] 📩 ${nome} (${telefone}): ${texto}`);

  // Se um atendente humano assumiu o controle, não interfere
  if (estaEmControleHumano(telefone)) {
    console.log(`   ↳ atendimento humano ativo, bot silenciado.`);
    return;
  }

  // Comandos especiais (só para o número do hotel usar via WhatsApp)
  if (texto.startsWith("/humano ")) {
    // /humano 5511999999999  → ativa controle humano para aquele número
    const alvo = texto.split(" ")[1];
    setControleHumano(alvo, true);
    console.log(`   ↳ controle humano ativado para ${alvo}`);
    return;
  }
  if (texto.startsWith("/bot ")) {
    // /bot 5511999999999  → devolve o controle para a IA
    const alvo = texto.split(" ")[1];
    setControleHumano(alvo, false);
    await enviarTexto(alvo, "Olá! A Sofia voltou. Como posso ajudar? 😊");
    return;
  }

  try {
    // Verifica se hóspede tem reserva ativa (para personalizar o atendimento)
    let infoHospede = "";
    const reservaAtiva = await buscarReservaPorTelefone(telefone).catch(() => null);
    if (reservaAtiva) {
      const ci = new Date(reservaAtiva.checkIn).toLocaleDateString("pt-BR");
      const co = new Date(reservaAtiva.checkOut).toLocaleDateString("pt-BR");
      infoHospede =
        `## Hóspede atualmente hospedado\n` +
        `Nome: ${reservaAtiva.hóspede}\n` +
        `Reserva: ${reservaAtiva.id}\n` +
        `Quarto: ${reservaAtiva.quarto}\n` +
        `Check-in: ${ci} | Check-out: ${co}\n` +
        `Status: ${reservaAtiva.status}\n` +
        `Use esses dados para personalizar o atendimento. ` +
        `Chame pelo nome e pergunte se está tudo bem antes de perguntar o que precisa.`;
    }

    // Adiciona a mensagem do usuário ao histórico
    adicionarMensagem(telefone, "user", texto);

    // Gera resposta com IA
    const historico = obterHistorico(telefone);
    const resposta = await responder(historico, telefone, infoHospede);

    // Salva resposta no histórico
    adicionarMensagem(telefone, "assistant", resposta);

    // Envia para o WhatsApp
    await enviarTexto(telefone, resposta);

    console.log(`   ↳ Sofia: ${resposta.slice(0, 100)}${resposta.length > 100 ? "…" : ""}`);

  } catch (err) {
    console.error(`[erro] ${telefone}:`, err);
    await enviarTexto(
      telefone,
      "Desculpe, tive um problema técnico. Nossa equipe já foi avisada. Tente novamente em instantes!",
    ).catch(() => {});
  }
});

// ─── Inicialização ────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`\n🏨 ${config.hotel.nome} — WhatsApp AI Bot`);
  console.log(`   Porta: ${config.port}`);
  console.log(`   Webhook: POST /webhook`);
  console.log(`   Health:  GET  /\n`);
  console.log(`   Configure o webhook na Z-API:`);
  console.log(`   URL: https://SEU_DOMINIO/webhook\n`);
});
