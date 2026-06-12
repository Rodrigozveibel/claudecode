import dotenv from "dotenv";
import path from "path";

// Load .env from project root (one level up) and local backend .env
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    console.warn(`[env] Missing environment variable: ${name}`);
    return "";
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  frontendUrl: required("FRONTEND_URL", "http://localhost:3000"),

  // Claude AI
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  anthropicModel: required("ANTHROPIC_MODEL", "claude-sonnet-4-6"),

  // WhatsApp provider
  whatsappProvider: (process.env.WHATSAPP_PROVIDER ?? "zapi") as
    | "zapi"
    | "twilio"
    | "meta",

  // Z-API
  zapi: {
    instanceId: process.env.ZAPI_INSTANCE_ID ?? "",
    token: process.env.ZAPI_TOKEN ?? "",
    securityToken: process.env.ZAPI_SECURITY_TOKEN ?? "",
    baseUrl: process.env.ZAPI_BASE_URL ?? "https://api.z-api.io",
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
  },

  // Hotel
  hotel: {
    name: process.env.HOTEL_NAME ?? "Hotel Paradise",
    phone: process.env.HOTEL_PHONE ?? "+55 11 99999-9999",
    email: process.env.HOTEL_EMAIL ?? "contato@hotelparadise.com.br",
    address: process.env.HOTEL_ADDRESS ?? "Rua das Flores, 123 - São Paulo/SP",
    checkInTime: process.env.HOTEL_CHECK_IN_TIME ?? "14:00",
    checkOutTime: process.env.HOTEL_CHECK_OUT_TIME ?? "12:00",
  },
};

export type Env = typeof env;
