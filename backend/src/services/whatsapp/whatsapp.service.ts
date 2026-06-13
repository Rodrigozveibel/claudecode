import axios from "axios";
import crypto from "crypto";
import { env } from "../../config/env";

export type WhatsAppMessageType = "text" | "image" | "document";

export interface OutboundMessage {
  to: string; // phone in E.164-ish digits, e.g. 5511999998888
  text: string;
  type?: WhatsAppMessageType;
  mediaUrl?: string;
  caption?: string;
}

/** Normalised inbound message extracted from a provider webhook payload. */
export interface InboundMessage {
  from: string; // sender phone (digits)
  name?: string;
  text: string;
  type: "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO";
  mediaUrl?: string;
  messageId?: string;
  fromMe?: boolean;
}

/**
 * Strip everything that is not a digit. Z-API and Meta both expect plain
 * digit phone numbers (country code + number, no +).
 */
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

async function sendViaZapi(msg: OutboundMessage): Promise<void> {
  const { instanceId, token, securityToken, baseUrl } = env.zapi;
  if (!instanceId || !token) {
    console.warn("[whatsapp] Z-API not configured — message not sent (dev mode).");
    console.log(`[whatsapp:dev] -> ${msg.to}: ${msg.text}`);
    return;
  }

  const headers: Record<string, string> = {};
  if (securityToken) headers["Client-Token"] = securityToken;

  const base = `${baseUrl}/instances/${instanceId}/token/${token}`;
  const phone = normalizePhone(msg.to);

  if (msg.type === "image" && msg.mediaUrl) {
    await axios.post(
      `${base}/send-image`,
      { phone, image: msg.mediaUrl, caption: msg.caption ?? msg.text },
      { headers },
    );
    return;
  }

  if (msg.type === "document" && msg.mediaUrl) {
    await axios.post(
      `${base}/send-document/pdf`,
      { phone, document: msg.mediaUrl, caption: msg.caption ?? msg.text },
      { headers },
    );
    return;
  }

  await axios.post(`${base}/send-text`, { phone, message: msg.text }, { headers });
}

async function sendViaTwilio(msg: OutboundMessage): Promise<void> {
  const { accountSid, authToken, whatsappNumber } = env.twilio;
  if (!accountSid || !authToken) {
    console.warn("[whatsapp] Twilio not configured — message not sent (dev mode).");
    console.log(`[whatsapp:dev] -> ${msg.to}: ${msg.text}`);
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append("From", whatsappNumber);
  params.append("To", `whatsapp:+${normalizePhone(msg.to)}`);
  params.append("Body", msg.text);
  if (msg.mediaUrl) params.append("MediaUrl", msg.mediaUrl);

  await axios.post(url, params, {
    auth: { username: accountSid, password: authToken },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export const whatsappService = {
  async send(msg: OutboundMessage): Promise<void> {
    try {
      if (env.whatsappProvider === "twilio") {
        await sendViaTwilio(msg);
      } else {
        // zapi and meta both default through Z-API style here
        await sendViaZapi(msg);
      }
    } catch (err) {
      const detail =
        axios.isAxiosError(err) && err.response
          ? JSON.stringify(err.response.data)
          : (err as Error).message;
      console.error(`[whatsapp] send failed: ${detail}`);
      throw err;
    }
  },

  async sendText(to: string, text: string): Promise<void> {
    await this.send({ to, text, type: "text" });
  },

  // -------------------------------------------------------------------------
  // Webhook parsing
  // -------------------------------------------------------------------------

  /**
   * Verify an inbound webhook signature. Z-API uses the security token; Meta
   * uses an HMAC-SHA256 over the raw body. Returns true when no secret is
   * configured (dev convenience).
   */
  verifySignature(rawBody: string, signature?: string): boolean {
    if (env.whatsappProvider === "meta") {
      const appSecret = env.zapi.securityToken; // reuse field as app secret in meta mode
      if (!appSecret) return true;
      if (!signature) return false;
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
      try {
        return crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expected),
        );
      } catch {
        return false;
      }
    }

    // Z-API: optional Client-Token header check
    const expectedToken = env.zapi.securityToken;
    if (!expectedToken) return true;
    return signature === expectedToken;
  },

  /**
   * Normalise the wildly different webhook shapes (Z-API / Twilio / Meta) into
   * a single InboundMessage. Returns null when the payload is not an inbound
   * text/media message we should respond to.
   */
  parseWebhook(body: any): InboundMessage | null {
    if (!body) return null;

    // --- Z-API shape -------------------------------------------------------
    // { phone, senderName, text: { message }, type, fromMe, image:{imageUrl}... }
    if (body.phone && (body.text || body.image || body.document || body.audio)) {
      const fromMe = Boolean(body.fromMe);
      if (fromMe) return null;
      let type: InboundMessage["type"] = "TEXT";
      let text = "";
      let mediaUrl: string | undefined;

      if (body.text?.message) {
        text = body.text.message;
        type = "TEXT";
      } else if (body.image) {
        type = "IMAGE";
        text = body.image.caption ?? "[imagem]";
        mediaUrl = body.image.imageUrl;
      } else if (body.document) {
        type = "DOCUMENT";
        text = body.document.caption ?? "[documento]";
        mediaUrl = body.document.documentUrl;
      } else if (body.audio) {
        type = "AUDIO";
        text = "[áudio]";
        mediaUrl = body.audio.audioUrl;
      }

      return {
        from: normalizePhone(body.phone),
        name: body.senderName ?? body.chatName,
        text,
        type,
        mediaUrl,
        messageId: body.messageId,
        fromMe,
      };
    }

    // --- Twilio shape ------------------------------------------------------
    // { From: 'whatsapp:+5511...', Body: '...', ProfileName, NumMedia, MediaUrl0 }
    if (body.From && (body.Body !== undefined || body.NumMedia)) {
      const numMedia = parseInt(body.NumMedia ?? "0", 10);
      return {
        from: normalizePhone(body.From),
        name: body.ProfileName,
        text: body.Body || (numMedia > 0 ? "[mídia]" : ""),
        type: numMedia > 0 ? "IMAGE" : "TEXT",
        mediaUrl: body.MediaUrl0,
      };
    }

    // --- Meta Cloud API shape ---------------------------------------------
    // entry[].changes[].value.messages[]
    try {
      const value = body.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];
      if (message) {
        const contact = value?.contacts?.[0];
        const type: InboundMessage["type"] =
          message.type === "image"
            ? "IMAGE"
            : message.type === "document"
              ? "DOCUMENT"
              : message.type === "audio"
                ? "AUDIO"
                : "TEXT";
        return {
          from: normalizePhone(message.from),
          name: contact?.profile?.name,
          text:
            message.text?.body ??
            message.image?.caption ??
            message.document?.caption ??
            `[${message.type}]`,
          type,
          messageId: message.id,
        };
      }
    } catch {
      /* not a meta payload */
    }

    return null;
  },
};

export default whatsappService;
