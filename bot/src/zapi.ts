import axios from "axios";
import { config } from "./config";

const http = axios.create({
  baseURL: `${config.zapi.baseUrl}/instances/${config.zapi.instanceId}/token/${config.zapi.token}`,
  headers: { "Client-Token": config.zapi.securityToken },
});

/** Envia mensagem de texto simples */
export async function enviarTexto(telefone: string, mensagem: string) {
  await http.post("/send-text", { phone: telefone, message: mensagem });
}

/** Valida se o webhook veio da Z-API (header client-token) */
export function webhookValido(clientToken: string | undefined): boolean {
  return clientToken === config.zapi.securityToken;
}

/** Estrutura da mensagem recebida via webhook Z-API */
export interface MensagemRecebida {
  telefone: string;       // número do remetente
  nome: string;           // nome salvo no WhatsApp
  texto: string;          // conteúdo da mensagem
  tipo: string;           // "text" | "image" | "audio" | ...
  minha: boolean;         // true = mensagem enviada pelo próprio número do hotel
}

/** Normaliza o payload do webhook Z-API */
export function parsearWebhook(body: Record<string, unknown>): MensagemRecebida | null {
  // Z-API envia fromMe=true para mensagens enviadas pelo próprio número
  if (body.fromMe) return null;
  // Ignora mensagens que não têm texto (áudios, imagens sem legenda, etc.)
  const texto =
    (body.text as Record<string, unknown>)?.message as string ||
    (body.caption as string) ||
    "";
  if (!texto.trim()) return null;

  return {
    telefone: (body.phone as string) ?? "",
    nome: (body.senderName as string) ?? "",
    texto: texto.trim(),
    tipo: (body.type as string) ?? "text",
    minha: false,
  };
}
