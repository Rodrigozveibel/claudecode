/**
 * Gerenciamento de contexto de conversa por telefone.
 *
 * Cada número tem:
 *  - histórico de mensagens (últimas 30)
 *  - dados coletados durante a conversa (nome, datas, quarto escolhido, etc.)
 *  - flag de controle humano (quando recepcionista assume o atendimento)
 */
import type Anthropic from "@anthropic-ai/sdk";

export interface DadosConversa {
  nome?: string;
  email?: string;
  cpf?: string;
  checkIn?: string;
  checkOut?: string;
  quartoId?: string;
  quartoTipo?: string;
  numHospedes?: number;
  reservaId?: string;
  totalReserva?: number;
  linkPagamento?: string;
}

interface Conversa {
  historico: Anthropic.MessageParam[];
  dados: DadosConversa;
  humanoAtivo: boolean;
  ultimaAtividade: number;
}

// Armazena em memória (reinicializa se o bot reiniciar).
// Para persistência entre reinicializações, salve em um arquivo JSON ou SQLite.
const conversas = new Map<string, Conversa>();

const MAX_HISTORICO = 30;
const TTL_MS = 24 * 60 * 60 * 1000; // limpa conversas inativas há mais de 24h

function obterOuCriar(telefone: string): Conversa {
  let c = conversas.get(telefone);
  if (!c) {
    c = { historico: [], dados: {}, humanoAtivo: false, ultimaAtividade: Date.now() };
    conversas.set(telefone, c);
  }
  c.ultimaAtividade = Date.now();
  return c;
}

/** Adiciona uma mensagem ao histórico */
export function adicionarMensagem(
  telefone: string,
  role: "user" | "assistant",
  content: string,
): void {
  const c = obterOuCriar(telefone);
  c.historico.push({ role, content });
  if (c.historico.length > MAX_HISTORICO) {
    // Mantém sempre o primeiro par (contexto inicial) + os últimos mensagens
    c.historico.splice(1, c.historico.length - MAX_HISTORICO);
  }
}

/** Retorna o histórico completo para enviar ao Claude */
export function obterHistorico(telefone: string): Anthropic.MessageParam[] {
  return obterOuCriar(telefone).historico;
}

/** Atualiza dados coletados na conversa */
export function atualizarDados(telefone: string, novos: Partial<DadosConversa>): void {
  const c = obterOuCriar(telefone);
  c.dados = { ...c.dados, ...novos };
}

/** Retorna dados coletados */
export function obterDados(telefone: string): DadosConversa {
  return obterOuCriar(telefone).dados;
}

/** Ativa/desativa o controle humano */
export function setControleHumano(telefone: string, ativo: boolean): void {
  obterOuCriar(telefone).humanoAtivo = ativo;
}

/** Retorna se o número está em atendimento humano */
export function estaEmControleHumano(telefone: string): boolean {
  return obterOuCriar(telefone).humanoAtivo;
}

/** Remove conversas antigas para não acumular memória */
export function limparConversasAntigas(): void {
  const agora = Date.now();
  for (const [tel, conv] of conversas) {
    if (agora - conv.ultimaAtividade > TTL_MS) conversas.delete(tel);
  }
}

// Limpeza automática a cada hora
setInterval(limparConversasAntigas, 60 * 60 * 1000);
