import type { Request, Response } from "express";
import { promotionService } from "../services/scheduler/promotion.service";
import { TargetSegment } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";

export const promotionsController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await promotionService.list());
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      name?: string;
      message?: string;
      targetSegment?: TargetSegment;
      scheduledAt?: string;
    };
    if (!body.name || !body.message) {
      throw new ApiError(400, "Nome e mensagem são obrigatórios");
    }
    const promotion = await promotionService.create({
      name: body.name,
      message: body.message,
      targetSegment: body.targetSegment ?? TargetSegment.ALL,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
    res.status(201).json(promotion);
  },

  async send(req: Request, res: Response): Promise<void> {
    // Kick off async; respond immediately.
    res.json({ success: true, message: "Envio iniciado" });
    promotionService.send(req.params.id).catch((err) =>
      console.error("[promotion] send error:", err.message),
    );
  },
};

export default promotionsController;
