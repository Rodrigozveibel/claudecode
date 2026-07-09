import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  create = (req: Request, res: Response): void => {
    const booking = this.bookingService.create(req.body);
    res.status(201).json(booking);
  };

  list = (_req: Request, res: Response): void => {
    res.json(this.bookingService.list());
  };

  getById = (req: Request, res: Response): void => {
    res.json(this.bookingService.getById(req.params.id));
  };

  update = (req: Request, res: Response): void => {
    res.json(this.bookingService.update(req.params.id, req.body));
  };

  cancel = (req: Request, res: Response): void => {
    res.json(this.bookingService.cancel(req.params.id));
  };

  delete = (req: Request, res: Response): void => {
    this.bookingService.delete(req.params.id);
    res.status(204).send();
  };
}
