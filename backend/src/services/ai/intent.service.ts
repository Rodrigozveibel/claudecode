import { claudeService } from "./claude.service";

/**
 * Intent classification helper. Used for analytics and routing. Wraps the
 * Claude classifier but adds cheap keyword heuristics as a fast path so we
 * don't spend tokens on obvious cases.
 */
export const intentService = {
  async classify(text: string): Promise<string> {
    const t = text.toLowerCase();
    if (/(cancel|desmarc|estornar)/.test(t)) return "cancelamento";
    if (/(disponib|tem vaga|quarto livre|tem quarto)/.test(t)) return "disponibilidade";
    if (/(reserv|quero fechar|confirmar)/.test(t)) return "reserva";
    if (/(nota|avalia|feedback|estrela|gostei|não gostei)/.test(t)) return "feedback";
    return claudeService.classifyIntent(text);
  },
};

export default intentService;
