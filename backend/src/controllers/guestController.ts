import { Request, Response } from 'express';
import { GuestService } from '../services/guestService';

export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  create = (req: Request, res: Response): void => {
    const guest = this.guestService.create(req.body);
    res.status(201).json(guest);
  };

  list = (_req: Request, res: Response): void => {
    res.json(this.guestService.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.guestService.getById(req.params.id));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.guestService.update(req.params.id, req.body));
  };

  delete = (req: Request, res: Response): void => {
    this.guestService.delete(req.params.id);
    res.status(204).send();
  };
}
