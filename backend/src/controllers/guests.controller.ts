import type { Request, Response } from "express";
import { guestService } from "../services/hotel/guest.service";
import { GuestSegment } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";

export const guestsController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await guestService.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    const guest = await guestService.getById(req.params.id);
    if (!guest) throw new ApiError(404, "Hóspede não encontrado");
    res.json(guest);
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      name: string;
      phone: string;
      email?: string;
      cpf?: string;
      segment?: GuestSegment;
      notes?: string;
    };
    if (!body.name || !body.phone) {
      throw new ApiError(400, "Nome e telefone são obrigatórios");
    }
    const guest = await guestService.create(body);
    res.status(201).json(guest);
  },

  async update(req: Request, res: Response): Promise<void> {
    const guest = await guestService.update(
      req.params.id,
      req.body as Record<string, never>,
    );
    res.json(guest);
  },
};

export default guestsController;
