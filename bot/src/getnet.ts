/**
 * Integração com GetNet para geração de links de pagamento
 * Docs: https://developers.getnet.com.br/api#tag/Link-de-Pagamento
 */
import axios from "axios";
import { config } from "./config";

const BASE_URL = {
  sandbox: "https://api-sandbox.getnet.com.br",
  production: "https://api.getnet.com.br",
}[config.getnet.env];

let _token: string | null = null;
let _tokenExpira = 0;

/** Autenticação OAuth2 do GetNet (token expira em 3600s) */
async function obterToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpira) return _token;

  const credencial = Buffer.from(
    `${config.getnet.clientId}:${config.getnet.clientSecret}`,
  ).toString("base64");

  const { data } = await axios.post(
    `${BASE_URL}/auth/oauth/v2/token`,
    "scope=oob&grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${credencial}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  _token = data.access_token as string;
  _tokenExpira = Date.now() + (data.expires_in as number) * 1000 - 60_000;
  return _token;
}

export interface LinkPagamento {
  url: string;
  id: string;
}

/**
 * Gera um link de pagamento GetNet.
 * O cliente clica no link e paga com cartão, Pix ou boleto.
 */
export async function gerarLink(
  valor: number,          // valor em R$ (ex: 440.00)
  descricao: string,      // ex: "Reserva Hotel Paradise – 13/06 a 15/06"
  reservaId: string,      // ID da reserva no Simples (para rastreio)
  expiracaoHoras = 48,    // quantas horas o link fica válido
): Promise<LinkPagamento> {
  const token = await obterToken();

  const expira = new Date(Date.now() + expiracaoHoras * 3_600_000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const { data } = await axios.post(
    `${BASE_URL}/v1/payment-links`,
    {
      seller_id: config.getnet.sellerId,
      name_link: descricao,
      description: descricao,
      expiration_date: expira,
      amount: Math.round(valor * 100), // centavos
      currency: "BRL",
      order_id: reservaId,
      payment_methods: [
        { payment_method_type: "CREDIT" },
        { payment_method_type: "DEBIT" },
        { payment_method_type: "PIX" },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        seller_id: config.getnet.sellerId,
      },
    },
  );

  return {
    url: (data.payment_url ?? data.url) as string,
    id: (data.payment_link_id ?? data.id) as string,
  };
}
