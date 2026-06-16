/**
 * Núcleo de IA — integração com Claude + definição das ferramentas (tools)
 *
 * Ferramentas disponíveis para o Claude:
 *  1. verificar_disponibilidade  → Simples PMS
 *  2. criar_reserva              → Simples PMS
 *  3. gerar_link_pagamento       → GetNet
 *  4. buscar_hospede_ativo       → Simples PMS (reconhece hóspedes já na casa)
 *  5. registrar_solicitacao      → Simples PMS (camareira, toalhas, etc.)
 *  6. informar_pix               → retorna dados de Pix do hotel
 */
import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";
import * as simples from "./simples";
import * as getnet from "./getnet";
import { atualizarDados, obterDados } from "./conversa";

const claude = new Anthropic({ apiKey: config.anthropicKey });

// ─── Sistema de prompt ──────────────────────────────────────────────────────

function sistemaPrompt(hospedadoInfo: string): string {
  const h = config.hotel;
  return `Você é a recepcionista virtual do ${h.nome}, atendendo pelo WhatsApp.
Seu nome é Sofia. Você é calorosa, profissional e eficiente.

## Informações do hotel
- Endereço: ${h.endereco}
- Telefone: ${h.telefone}
- E-mail: ${h.email}
- Check-in: a partir das ${h.checkIn}
- Check-out: até as ${h.checkOut}
- Chave Pix: ${h.pixChave}
- Pagamento: Pix, cartão via link GetNet (crédito/débito)
- Café da manhã incluso em todas as diárias
- Cancelamento gratuito até 48h antes do check-in
- Animais de pequeno porte aceitos mediante aviso
- Wi-Fi e estacionamento gratuitos

${hospedadoInfo}

## Como você age
- Escreva mensagens curtas, no estilo do WhatsApp. Nunca mande paredes de texto.
- Use o nome do hóspede assim que souber.
- NUNCA repita frases prontas. Cada mensagem deve ser natural e contextual.
- Para verificar disponibilidade e preços, SEMPRE use a ferramenta verificar_disponibilidade — nunca invente valores.
- Antes de criar uma reserva, confirme: nome completo, check-in, check-out, número de hóspedes.
- Após criar a reserva, gere o link de pagamento GetNet E informe também o Pix como opção.
- Se o hóspede já está hospedado, use o contexto da reserva dele para personalizar o atendimento.
- Se não souber algo, ofereça transferir para um atendente humano.
- Datas sempre no formato brasileiro (DD/MM/AAAA). Valores em R$.

## Hoje
${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`;
}

// ─── Definição das ferramentas ───────────────────────────────────────────────

const ferramentas: Anthropic.Tool[] = [
  {
    name: "verificar_disponibilidade",
    description: "Verifica quartos disponíveis e tarifas reais no período solicitado. Use sempre antes de informar preços.",
    input_schema: {
      type: "object" as const,
      properties: {
        check_in:  { type: "string", description: "Data de check-in (YYYY-MM-DD)" },
        check_out: { type: "string", description: "Data de check-out (YYYY-MM-DD)" },
        pessoas:   { type: "integer", description: "Número de hóspedes. Opcional." },
      },
      required: ["check_in", "check_out"],
    },
  },
  {
    name: "criar_reserva",
    description: "Cria a reserva no sistema do hotel. Use somente após confirmar: nome, check-in, check-out, tipo de quarto e nº de hóspedes.",
    input_schema: {
      type: "object" as const,
      properties: {
        nome:          { type: "string", description: "Nome completo do hóspede" },
        telefone:      { type: "string", description: "Telefone do hóspede (já disponível na conversa)" },
        email:         { type: "string", description: "E-mail. Opcional." },
        cpf:           { type: "string", description: "CPF. Opcional." },
        quarto_id:     { type: "string", description: "ID do quarto retornado por verificar_disponibilidade" },
        quarto_tipo:   { type: "string", description: "Tipo do quarto (ex: Standard, Luxo, Suíte)" },
        check_in:      { type: "string", description: "Data de check-in (YYYY-MM-DD)" },
        check_out:     { type: "string", description: "Data de check-out (YYYY-MM-DD)" },
        num_hospedes:  { type: "integer", description: "Número de hóspedes" },
        observacoes:   { type: "string", description: "Observações da reserva. Opcional." },
      },
      required: ["nome", "telefone", "quarto_id", "check_in", "check_out", "num_hospedes"],
    },
  },
  {
    name: "gerar_link_pagamento",
    description: "Gera link de pagamento GetNet (cartão crédito/débito + Pix) para a reserva criada.",
    input_schema: {
      type: "object" as const,
      properties: {
        valor:      { type: "number", description: "Valor total em R$ (ex: 440.00)" },
        descricao:  { type: "string", description: "Descrição do pagamento (ex: Reserva – 13/06 a 15/06)" },
        reserva_id: { type: "string", description: "ID da reserva no Simples" },
      },
      required: ["valor", "descricao", "reserva_id"],
    },
  },
  {
    name: "buscar_hospede_ativo",
    description: "Verifica se o número tem reserva ativa (check-in já feito). Use no início da conversa para reconhecer hóspedes já hospedados.",
    input_schema: {
      type: "object" as const,
      properties: {
        telefone: { type: "string", description: "Telefone do hóspede" },
      },
      required: ["telefone"],
    },
  },
  {
    name: "registrar_solicitacao",
    description: "Registra uma solicitação de serviço para hóspede hospedado (camareira, toalhas, room service, manutenção, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        reserva_id: { type: "string", description: "ID da reserva ativa" },
        tipo:       { type: "string", description: "Tipo da solicitação (ex: limpeza, toalha, manutenção)" },
        descricao:  { type: "string", description: "Descrição detalhada do que o hóspede precisa" },
      },
      required: ["reserva_id", "tipo", "descricao"],
    },
  },
  {
    name: "informar_pix",
    description: "Retorna os dados de Pix do hotel para o hóspede efetuar o pagamento manualmente.",
    input_schema: {
      type: "object" as const,
      properties: {
        valor:     { type: "number", description: "Valor a cobrar em R$" },
        descricao: { type: "string", description: "Descrição do pagamento" },
      },
      required: ["valor"],
    },
  },
];

// ─── Execução das ferramentas ────────────────────────────────────────────────

async function executarFerramenta(
  nome: string,
  input: Record<string, unknown>,
  telefone: string,
): Promise<string> {
  const dados = obterDados(telefone);

  switch (nome) {

    case "verificar_disponibilidade": {
      const quartos = await simples.verificarDisponibilidade(
        input.check_in as string,
        input.check_out as string,
        input.pessoas as number | undefined,
      );
      if (!quartos.length) return "Nenhum quarto disponível para esse período.";
      return JSON.stringify(quartos, null, 2);
    }

    case "criar_reserva": {
      const reserva = await simples.criarReserva(
        {
          nome: input.nome as string,
          telefone: (input.telefone as string) || telefone,
          email: input.email as string | undefined,
          cpf: input.cpf as string | undefined,
        },
        input.quarto_id as string,
        input.check_in as string,
        input.check_out as string,
        input.num_hospedes as number,
        input.observacoes as string | undefined,
      );
      // Salva na conversa para uso posterior
      atualizarDados(telefone, {
        nome: input.nome as string,
        reservaId: reserva.id,
        totalReserva: reserva.total,
        quartoTipo: input.quarto_tipo as string,
        checkIn: input.check_in as string,
        checkOut: input.check_out as string,
      });
      return JSON.stringify(reserva, null, 2);
    }

    case "gerar_link_pagamento": {
      const link = await getnet.gerarLink(
        input.valor as number,
        input.descricao as string,
        (input.reserva_id as string) || dados.reservaId || "",
      );
      atualizarDados(telefone, { linkPagamento: link.url });
      return JSON.stringify(link, null, 2);
    }

    case "buscar_hospede_ativo": {
      const reserva = await simples.buscarReservaPorTelefone(
        (input.telefone as string) || telefone,
      );
      if (!reserva) return "Nenhuma reserva ativa encontrada para esse número.";
      atualizarDados(telefone, { reservaId: reserva.id, nome: reserva.hóspede });
      return JSON.stringify(reserva, null, 2);
    }

    case "registrar_solicitacao": {
      const resId = (input.reserva_id as string) || dados.reservaId || "";
      await simples.registrarSolicitacao(
        resId,
        input.tipo as string,
        input.descricao as string,
      );
      return "Solicitação registrada com sucesso.";
    }

    case "informar_pix": {
      return JSON.stringify({
        chave: config.hotel.pixChave,
        nome: config.hotel.nome,
        valor: input.valor,
        descricao: input.descricao ?? "",
        instrucao: "Após o pagamento, envie o comprovante por aqui.",
      });
    }

    default:
      return "Ferramenta não reconhecida.";
  }
}

// ─── Função principal: responder ─────────────────────────────────────────────

export async function responder(
  historico: Anthropic.MessageParam[],
  telefone: string,
  infoHospede: string,
): Promise<string> {
  const msgs = [...historico];

  // Loop de tool-use: Claude pode chamar múltiplas ferramentas em sequência
  for (let iteracao = 0; iteracao < 10; iteracao++) {
    const resposta = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: sistemaPrompt(infoHospede),
      tools: ferramentas,
      messages: msgs,
    });

    if (resposta.stop_reason === "end_turn") {
      // Resposta de texto final
      const bloco = resposta.content.find((b) => b.type === "text");
      return bloco?.type === "text" ? bloco.text : "Desculpe, não entendi. Pode repetir?";
    }

    if (resposta.stop_reason === "tool_use") {
      // Claude quer usar uma ou mais ferramentas
      msgs.push({ role: "assistant", content: resposta.content });

      const resultados: Anthropic.ToolResultBlockParam[] = [];
      for (const bloco of resposta.content) {
        if (bloco.type !== "tool_use") continue;
        let resultado: string;
        try {
          resultado = await executarFerramenta(
            bloco.name,
            bloco.input as Record<string, unknown>,
            telefone,
          );
        } catch (err) {
          resultado = `Erro ao executar ${bloco.name}: ${(err as Error).message}`;
          console.error(`[tool:${bloco.name}]`, err);
        }
        resultados.push({ type: "tool_result", tool_use_id: bloco.id, content: resultado });
      }

      msgs.push({ role: "user", content: resultados });
      continue;
    }

    break;
  }

  return "Desculpe, tive um problema interno. Pode tentar novamente?";
}
