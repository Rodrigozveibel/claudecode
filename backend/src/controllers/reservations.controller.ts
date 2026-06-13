import type { Request, Response } from "express";
import { reservationService } from "../services/hotel/reservation.service";
import { roomService } from "../services/hotel/room.service";
import { guestService } from "../services/hotel/guest.service";
import { ReservationStatus } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";

export const reservationsController = {
  async list(req: Request, res: Response): Promise<void> {
    const { status, from, to, roomType } = req.query as Record<string, string>;
    const reservations = await reservationService.list({
      status: status ? (status as ReservationStatus) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      roomType,
    });
    res.json(reservations);
  },

  async get(req: Request, res: Response): Promise<void> {
    const reservation = await reservationService.getById(req.params.id);
    if (!reservation) throw new ApiError(404, "Reserva não encontrada");
    res.json(reservation);
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      guestId?: string;
      guestName?: string;
      guestPhone?: string;
      roomId?: string;
      roomType?: string;
      checkIn: string;
      checkOut: string;
      guests?: number;
      notes?: string;
    };

    if (!body.checkIn || !body.checkOut) {
      throw new ApiError(400, "Datas de check-in e check-out são obrigatórias");
    }
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);

    // Resolve guest
    let guestId = body.guestId;
    if (!guestId) {
      if (!body.guestPhone) throw new ApiError(400, "Telefone do hóspede obrigatório");
      const guest = await guestService.findOrCreate(body.guestPhone, body.guestName);
      guestId = guest.id;
    }

    // Resolve room
    let roomId = body.roomId;
    if (!roomId) {
      if (!body.roomType) throw new ApiError(400, "Quarto ou tipo de quarto obrigatório");
      const available = await roomService.checkAvailability({
        checkIn,
        checkOut,
        roomType: body.roomType,
        guests: body.guests,
      });
      if (available.length === 0) throw new ApiError(409, "Sem quartos disponíveis");
      roomId = available[0].id;
    }

    try {
      const reservation = await reservationService.create({
        guestId,
        roomId,
        checkIn,
        checkOut,
        guests: body.guests,
        notes: body.notes,
      });
      res.status(201).json(reservation);
    } catch (err) {
      if ((err as Error).message === "ROOM_UNAVAILABLE") {
        throw new ApiError(409, "Quarto indisponível para este período");
      }
      throw err;
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (body.checkIn) data.checkIn = new Date(body.checkIn as string);
    if (body.checkOut) data.checkOut = new Date(body.checkOut as string);
    if (body.guests !== undefined) data.guests = Number(body.guests);
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status) data.status = body.status as ReservationStatus;
    if (body.roomId) data.roomId = body.roomId;

    try {
      const reservation = await reservationService.update(req.params.id, data);
      res.json(reservation);
    } catch (err) {
      if ((err as Error).message === "RESERVATION_NOT_FOUND") {
        throw new ApiError(404, "Reserva não encontrada");
      }
      throw err;
    }
  },

  async cancel(req: Request, res: Response): Promise<void> {
    const reservation = await reservationService.cancel(req.params.id);
    res.json(reservation);
  },
};

export default reservationsController;
