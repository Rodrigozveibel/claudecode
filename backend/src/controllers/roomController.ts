import { Request, Response } from 'express';
import { RoomService } from '../services/roomService';

export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  create = (req: Request, res: Response): void => {
    const room = this.roomService.create(req.body);
    res.status(201).json(room);
  };

  list = (_req: Request, res: Response): void => {
    res.json(this.roomService.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.roomService.getById(req.params.id));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.roomService.update(req.params.id, req.body));
  };

  delete = (req: Request, res: Response): void => {
    this.roomService.delete(req.params.id);
    res.status(204).send();
  };
}
