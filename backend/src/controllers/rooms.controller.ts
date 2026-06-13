import type { Request, Response } from "express";
import { roomService } from "../services/hotel/room.service";
import { RoomStatus } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";

export const roomsController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await roomService.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    const room = await roomService.getById(req.params.id);
    if (!room) throw new ApiError(404, "Quarto não encontrado");
    res.json(room);
  },

  async availability(req: Request, res: Response): Promise<void> {
    const { checkIn, checkOut, roomType, guests } = req.query as Record<
      string,
      string
    >;
    if (!checkIn || !checkOut) {
      throw new ApiError(400, "Datas obrigatórias");
    }
    const rooms = await roomService.checkAvailability({
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      roomType,
      guests: guests ? Number(guests) : undefined,
    });
    res.json(rooms);
  },

  async update(req: Request, res: Response): Promise<void> {
    const body = req.body as { rate?: number; status?: RoomStatus };
    const data: { rate?: number; status?: RoomStatus } = {};
    if (body.rate !== undefined) data.rate = Number(body.rate);
    if (body.status) data.status = body.status;
    const room = await roomService.update(req.params.id, data);
    res.json(room);
  },
};

export default roomsController;
