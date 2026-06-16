/**
 * Integração com o Simples Hotelaria (PMS)
 *
 * A API do Simples Hotelaria usa autenticação via API Key no header.
 * Documentação: solicitar ao suporte do Simples em suporte@simpleshotelaria.com.br
 *
 * Os endpoints abaixo seguem o padrão REST do Simples.
 * Ajuste os paths se a sua versão do Simples tiver rotas diferentes.
 */
import axios from "axios";
import { config } from "./config";

const http = axios.create({
  baseURL: config.simples.apiUrl,
  headers: {
    Authorization: `Bearer ${config.simples.apiKey}`,
    "Content-Type": "application/json",
  },
});

export interface QuartoDisponivel {
  id: string;
  tipo: string;         // "Standard" | "Luxo" | "Suíte" ...
  nome: string;
  capacidade: number;
  tarifa: number;       // R$ por noite
  descricao: string;
  amenidades: string[];
}

export interface ReservaSimples {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  hóspede: string;
  quarto: string;
  total: number;
}

export interface DadosHospede {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
}

/** Verifica quartos disponíveis para o período */
export async function verificarDisponibilidade(
  checkIn: string,   // YYYY-MM-DD
  checkOut: string,  // YYYY-MM-DD
  pessoas?: number,
): Promise<QuartoDisponivel[]> {
  const { data } = await http.get(`/hotels/${config.simples.hotelId}/rooms/availability`, {
    params: { check_in: checkIn, check_out: checkOut, guests: pessoas },
  });
  // Normaliza resposta — adapte se necessário
  const items: QuartoDisponivel[] = (data.data ?? data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    tipo: (r.category ?? r.type ?? r.tipo) as string,
    nome: (r.name ?? r.nome) as string,
    capacidade: (r.capacity ?? r.capacidade ?? 2) as number,
    tarifa: (r.rate ?? r.diaria ?? r.price) as number,
    descricao: (r.description ?? r.descricao ?? "") as string,
    amenidades: (r.amenities ?? r.amenidades ?? []) as string[],
  }));
  return items;
}

/** Cria uma reserva no Simples */
export async function criarReserva(
  hospede: DadosHospede,
  quartoId: string,
  checkIn: string,
  checkOut: string,
  numHospedes: number,
  observacoes?: string,
): Promise<ReservaSimples> {
  const { data } = await http.post(`/hotels/${config.simples.hotelId}/reservations`, {
    guest: {
      name: hospede.nome,
      phone: hospede.telefone,
      email: hospede.email,
      cpf: hospede.cpf,
    },
    room_id: quartoId,
    check_in: checkIn,
    check_out: checkOut,
    guests: numHospedes,
    notes: observacoes,
    source: "whatsapp_bot",
  });
  const r = data.data ?? data;
  return {
    id: r.id as string,
    status: (r.status ?? "pending") as string,
    checkIn: (r.check_in ?? checkIn) as string,
    checkOut: (r.check_out ?? checkOut) as string,
    hóspede: hospede.nome,
    quarto: (r.room?.name ?? quartoId) as string,
    total: (r.total_amount ?? r.total ?? 0) as number,
  };
}

/** Busca reserva ativa pelo telefone do hóspede (para reconhecer hóspedes já hospedados) */
export async function buscarReservaPorTelefone(telefone: string): Promise<ReservaSimples | null> {
  try {
    const { data } = await http.get(`/hotels/${config.simples.hotelId}/reservations`, {
      params: { phone: telefone, status: "confirmed,checked_in", limit: 1 },
    });
    const items = data.data ?? data ?? [];
    if (!items.length) return null;
    const r = items[0];
    return {
      id: r.id as string,
      status: r.status as string,
      checkIn: r.check_in as string,
      checkOut: r.check_out as string,
      hóspede: (r.guest?.name ?? "") as string,
      quarto: (r.room?.name ?? "") as string,
      total: (r.total_amount ?? 0) as number,
    };
  } catch {
    return null;
  }
}

/** Registra uma solicitação de serviço (ex: camareira, toalhas, room service) */
export async function registrarSolicitacao(
  reservaId: string,
  tipo: string,
  descricao: string,
): Promise<void> {
  await http.post(`/hotels/${config.simples.hotelId}/reservations/${reservaId}/requests`, {
    type: tipo,
    description: descricao,
  });
}
