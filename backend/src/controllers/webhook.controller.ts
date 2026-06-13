import type { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp/whatsapp.service";
import { messageHandler } from "../services/whatsapp/message.handler";
import { env } from "../config/env";

export const webhookController = {
  /** Meta webhook verification handshake (GET). */
  verify(req: Request, res: Response): void {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === env.zapi.securityToken) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  },

  /** Inbound message webhook (POST) for Z-API / Twilio / Meta. */
  async receive(req: Request, res: Response): Promise<void> {
    const signature =
      (req.headers["client-token"] as string) ||
      (req.headers["x-hub-signature-256"] as string) ||
      undefined;
    const rawBody = JSON.stringify(req.body);

    if (!whatsappService.verifySignature(rawBody, signature)) {
      res.status(401).json({ error: "Assinatura inválida" });
      return;
    }

    // Acknowledge immediately so the provider doesn't retry; process async.
    res.status(200).json({ received: true });

    const inbound = whatsappService.parseWebhook(req.body);
    if (!inbound) return;

    try {
      await messageHandler.handleInbound(inbound);
    } catch (err) {
      console.error("[webhook] processing error:", (err as Error).message);
    }
  },
};

export default webhookController;
