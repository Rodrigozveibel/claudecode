import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { roomService } from "../hotel/room.service";
import { quoteService } from "../hotel/quote.service";
import { reservationService } from "../hotel/reservation.service";
import prisma from "../../config/database";

const client = new Anthropic({ apiKey: env.anthropicApiKey });

// ---------------------------------------------------------------------------
// System prompt — rich hotel concierge persona in Brazilian Portuguese
// ---------------------------------------------------------------------------
function buildSystemPrompt(): string {
  const h = env.hotel;
  return `Você é a Sofia, concierge virtual do ${h.name}, um hotel acolhedor no Brasil. Você atende hóspedes e potenciais clientes pelo WhatsApp.

# Sobre o hotel
- Nome: ${h.name}
- Endereço: ${h.address}
- Telefone: ${h.phone}
- E-mail: ${h.email}
- Check-in a partir das ${h.checkInTime}, check-out até as ${h.checkOutTime}
- Café da manhã incluído em todas as diárias
- Aceitamos Pix, cartão de crédito e débito
- Wi-Fi gratuito, estacionamento gratuito, piscina e academia

# Tipos de quarto
- Standard: confortável para até 2 pessoas, cama de casal, ar-condicionado, TV.
- Luxo: espaçoso, até 3 pessoas, varanda, frigobar, vista para a cidade.
- Suíte: para até 4 pessoas, sala de estar, hidromassagem, vista panorâmica.
(Use a ferramenta check_availability para preços e disponibilidade reais — nunca invente valores.)

# Políticas
- Cancelamento gratuito até 48h antes do check-in.
- Crianças até 5 anos não pagam.
- Animais de estimação de pequeno porte são bem-vindos mediante aviso.

# Seu papel
1. Cumprimente com simpatia e descubra a necessidade do hóspede.
2. Para verificar disponibilidade e gerar orçamentos, SEMPRE use as ferramentas — não estime preços de cabeça.
3. Apresente o orçamento de forma clara: tipo de quarto, número de noites, valor da diária e total.
4. Conduza a reserva: confirme nome completo, datas, número de hóspedes e tipo de quarto antes de criar a reserva.
5. Contorne objeções com cordialidade (ex.: destaque o café da manhã incluído, cancelamento flexível, localização).
6. Quando o hóspede aceitar, use create_reservation. Confirme a reserva com os detalhes.
7. Se o hóspede já tiver uma reserva, use get_reservation/update_reservation para ajudar.

# Estilo
- Tom caloroso, profissional e objetivo. Use o nome do hóspede quando souber.
- Mensagens curtas, adequadas ao WhatsApp. Use no máximo 1 emoji ocasional.
- Datas no formato brasileiro (DD/MM). Valores em reais (R$).
- Nunca prometa o que não pode cumprir; se não souber, ofereça transferir para um atendente humano.

Hoje é ${new Date().toLocaleDateString("pt-BR")}.`;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Verifica a disponibilidade de quartos e retorna preços reais para um período. Use sempre antes de informar valores.",
    input_schema: {
      type: "object",
      properties: {
        check_in: { type: "string", description: "Data de check-in (YYYY-MM-DD)" },
        check_out: { type: "string", description: "Data de check-out (YYYY-MM-DD)" },
        room_type: {
          type: "string",
          description: "Tipo de quarto desejado (Standard, Luxo, Suíte). Opcional.",
        },
        guests: { type: "integer", description: "Número de hóspedes. Opcional." },
      },
      required: ["check_in", "check_out"],
    },
  },
  {
    name: "create_quote",
    description:
      "Gera e registra um orçamento formal para o hóspede atual, com o melhor quarto disponível do tipo solicitado.",
    input_schema: {
      type: "object",
      properties: {
        check_in: { type: "string", description: "Data de check-in (YYYY-MM-DD)" },
        check_out: { type: "string", description: "Data de check-out (YYYY-MM-DD)" },
        room_type: { type: "string", description: "Tipo de quarto (Standard, Luxo, Suíte)" },
        guests: { type: "integer", description: "Número de hóspedes" },
      },
      required: ["check_in", "check_out", "room_type"],
    },
  },
  {
    name: "create_reservation",
    description:
      "Cria uma reserva confirmada para o hóspede atual. Use somente após confirmar nome, datas, tipo de quarto e número de hóspedes.",
    input_schema: {
      type: "object",
      properties: {
        guest_name: { type: "string", description: "Nome completo do hóspede" },
        check_in: { type: "string", description: "Data de check-in (YYYY-MM-DD)" },
        check_out: { type: "string", description: "Data de check-out (YYYY-MM-DD)" },
        room_type: { type: "string", description: "Tipo de quarto (Standard, Luxo, Suíte)" },
        guests: { type: "integer", description: "Número de hóspedes" },
        notes: { type: "string", description: "Observações adicionais. Opcional." },
      },
      required: ["guest_name", "check_in", "check_out", "room_type", "guests"],
    },
  },
  {
    name: "get_reservation",
    description: "Consulta a reserva mais recente do hóspede atual.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "update_reservation",
    description:
      "Atualiza ou cancela a reserva mais recente do hóspede atual (alterar datas ou cancelar).",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["update_dates", "cancel"],
          description: "Ação desejada",
        },
        check_in: { type: "string", description: "Nova data de check-in (YYYY-MM-DD). Opcional." },
        check_out: { type: "string", description: "Nova data de check-out (YYYY-MM-DD). Opcional." },
      },
      required: ["action"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution — each receives the guestId for the current conversation
// ---------------------------------------------------------------------------
interface ToolContext {
  guestId: string;
  guestName: string;
}

function parseDate(value: string): Date {
  // Accept YYYY-MM-DD and DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value + "T12:00:00");
  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}T12:00:00`);
  return new Date(value);
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  try {
    switch (name) {
      case "check_availability": {
        const checkIn = parseDate(String(input.check_in));
        const checkOut = parseDate(String(input.check_out));
        const rooms = await roomService.checkAvailability({
          checkIn,
          checkOut,
          roomType: input.room_type ? String(input.room_type) : undefined,
          guests: input.guests ? Number(input.guests) : undefined,
        });
        const nights = Math.max(
          1,
          Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000),
        );
        if (rooms.length === 0) {
          return JSON.stringify({
            available: false,
            message: "Nenhum quarto disponível para o período solicitado.",
          });
        }
        const byType = new Map<string, { rate: number; capacity: number }>();
        for (const r of rooms) {
          if (!byType.has(r.type)) byType.set(r.type, { rate: r.rate, capacity: r.capacity });
        }
        return JSON.stringify({
          available: true,
          nights,
          options: Array.from(byType.entries()).map(([type, v]) => ({
            type,
            rate_per_night: v.rate,
            capacity: v.capacity,
            total: v.rate * nights,
          })),
        });
      }

      case "create_quote": {
        const checkIn = parseDate(String(input.check_in));
        const checkOut = parseDate(String(input.check_out));
        const result = await quoteService.createQuote({
          guestId: ctx.guestId,
          roomType: String(input.room_type),
          checkIn,
          checkOut,
          guests: input.guests ? Number(input.guests) : undefined,
        });
        if (!result.available) {
          return JSON.stringify({
            success: false,
            message: "Sem disponibilidade para gerar orçamento nesse período.",
          });
        }
        return JSON.stringify({
          success: true,
          room_type: result.room.type,
          nights: result.nights,
          rate_per_night: result.pricePerNight,
          total: result.total,
          expires_in_hours: 48,
        });
      }

      case "create_reservation": {
        const checkIn = parseDate(String(input.check_in));
        const checkOut = parseDate(String(input.check_out));
        const roomType = String(input.room_type);
        const guests = Number(input.guests ?? 1);

        const available = await roomService.checkAvailability({
          checkIn,
          checkOut,
          roomType,
          guests,
        });
        if (available.length === 0) {
          return JSON.stringify({
            success: false,
            message: "Não há quartos disponíveis para confirmar a reserva.",
          });
        }
        const room = available[0];
        const reservation = await reservationService.create({
          guestId: ctx.guestId,
          roomId: room.id,
          checkIn,
          checkOut,
          guests,
          notes: input.notes ? String(input.notes) : undefined,
        });
        // Update guest name if provided
        if (input.guest_name) {
          await prisma.guest.update({
            where: { id: ctx.guestId },
            data: { name: String(input.guest_name) },
          });
        }
        // Convert active quote
        const activeQuote = await quoteService.getActiveByGuest(ctx.guestId);
        if (activeQuote) await quoteService.markConverted(activeQuote.id);

        return JSON.stringify({
          success: true,
          reservation_id: reservation.id,
          room_number: room.number,
          room_type: room.type,
          check_in: checkIn.toLocaleDateString("pt-BR"),
          check_out: checkOut.toLocaleDateString("pt-BR"),
          total: reservation.totalAmount,
        });
      }

      case "get_reservation": {
        const reservation = await prisma.reservation.findFirst({
          where: { guestId: ctx.guestId },
          orderBy: { createdAt: "desc" },
          include: { room: true },
        });
        if (!reservation) {
          return JSON.stringify({ found: false, message: "Nenhuma reserva encontrada." });
        }
        return JSON.stringify({
          found: true,
          reservation_id: reservation.id,
          room_number: reservation.room.number,
          room_type: reservation.room.type,
          check_in: reservation.checkIn.toLocaleDateString("pt-BR"),
          check_out: reservation.checkOut.toLocaleDateString("pt-BR"),
          status: reservation.status,
          total: reservation.totalAmount,
        });
      }

      case "update_reservation": {
        const reservation = await prisma.reservation.findFirst({
          where: {
            guestId: ctx.guestId,
            status: { notIn: ["CANCELADA", "FINALIZADA", "NO_SHOW"] },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!reservation) {
          return JSON.stringify({ success: false, message: "Nenhuma reserva ativa para alterar." });
        }
        if (input.action === "cancel") {
          await reservationService.cancel(reservation.id);
          return JSON.stringify({ success: true, message: "Reserva cancelada com sucesso." });
        }
        const data: { checkIn?: Date; checkOut?: Date } = {};
        if (input.check_in) data.checkIn = parseDate(String(input.check_in));
        if (input.check_out) data.checkOut = parseDate(String(input.check_out));
        const updated = await reservationService.update(reservation.id, data);
        return JSON.stringify({
          success: true,
          check_in: updated.checkIn.toLocaleDateString("pt-BR"),
          check_out: updated.checkOut.toLocaleDateString("pt-BR"),
          total: updated.totalAmount,
        });
      }

      default:
        return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
    }
  } catch (err) {
    const message = (err as Error).message;
    if (message === "ROOM_UNAVAILABLE") {
      return JSON.stringify({
        success: false,
        message: "O quarto ficou indisponível. Tente outro período ou tipo.",
      });
    }
    console.error(`[claude] tool ${name} failed:`, message);
    return JSON.stringify({ error: "Falha ao executar a operação. Tente novamente." });
  }
}

// ---------------------------------------------------------------------------
// Main entry — run the agentic loop over a conversation
// ---------------------------------------------------------------------------
export const claudeService = {
  /**
   * Given the conversation history (Anthropic message params) and guest
   * context, run Claude with tool use until it produces a final text reply.
   * Returns the assistant's reply text.
   */
  async respond(
    history: Anthropic.MessageParam[],
    ctx: ToolContext,
  ): Promise<string> {
    if (!env.anthropicApiKey) {
      return "Olá! No momento não consigo acessar o assistente automático. Um de nossos atendentes responderá em breve. 🙏";
    }

    const system = buildSystemPrompt();
    const messages: Anthropic.MessageParam[] = [...history];
    const MAX_TURNS = 6;

    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const response = await client.messages.create({
          model: env.anthropicModel,
          max_tokens: 1024,
          system,
          thinking: { type: "adaptive" },
          tools,
          messages,
        });

        if (response.stop_reason === "tool_use") {
          // Append assistant turn (with tool_use blocks) verbatim.
          messages.push({ role: "assistant", content: response.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type === "tool_use") {
              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>,
                ctx,
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }
          messages.push({ role: "user", content: toolResults });
          continue;
        }

        // Final answer — collect text blocks.
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return text || "Desculpe, não entendi. Pode reformular?";
      }

      return "Vou verificar isso com nossa equipe e já te retorno. 🙏";
    } catch (err) {
      console.error("[claude] respond failed:", (err as Error).message);
      return "Tivemos um pequeno problema técnico. Um atendente vai te ajudar em instantes. 🙏";
    }
  },

  /**
   * Lightweight intent extraction used by analytics/feedback. Returns a single
   * label. Falls back gracefully when the API is unavailable.
   */
  async classifyIntent(text: string): Promise<string> {
    if (!env.anthropicApiKey) return "outro";
    try {
      const response = await client.messages.create({
        model: env.anthropicModel,
        max_tokens: 16,
        system:
          "Classifique a mensagem do usuário em UMA palavra entre: disponibilidade, reserva, cancelamento, duvida, feedback, outro. Responda apenas a palavra.",
        messages: [{ role: "user", content: text }],
      });
      const label = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim()
        .toLowerCase();
      return label || "outro";
    } catch {
      return "outro";
    }
  },
};

export default claudeService;
