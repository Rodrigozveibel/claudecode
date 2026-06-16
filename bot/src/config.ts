import "dotenv/config";

function get(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  return v;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3000"),

  anthropicKey: get("ANTHROPIC_API_KEY"),

  zapi: {
    instanceId: get("ZAPI_INSTANCE_ID"),
    token: get("ZAPI_TOKEN"),
    securityToken: get("ZAPI_SECURITY_TOKEN"),
    baseUrl: "https://api.z-api.io",
  },

  getnet: {
    clientId: get("GETNET_CLIENT_ID"),
    clientSecret: get("GETNET_CLIENT_SECRET"),
    sellerId: get("GETNET_SELLER_ID"),
    env: (process.env.GETNET_ENV ?? "sandbox") as "sandbox" | "production",
  },

  simples: {
    apiUrl: get("SIMPLES_API_URL", "https://api.simpleshotelaria.com.br"),
    apiKey: get("SIMPLES_API_KEY"),
    hotelId: get("SIMPLES_HOTEL_ID"),
  },

  hotel: {
    nome: get("HOTEL_NOME", "Hotel Paradise"),
    endereco: get("HOTEL_ENDERECO", ""),
    telefone: get("HOTEL_TELEFONE", ""),
    email: get("HOTEL_EMAIL", ""),
    checkIn: get("HOTEL_CHECK_IN", "14:00"),
    checkOut: get("HOTEL_CHECK_OUT", "12:00"),
    pixChave: get("HOTEL_PIX_CHAVE", ""),
  },
};
