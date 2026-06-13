import { Request, Response, NextFunction } from 'express';
import * as guestsService from './guests.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    const { guests, total } = await guestsService.getAll(propertyId, page, limit, search);
    paginatedResponse(res, guests, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.getById(req.params.id);
    successResponse(res, guest);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.create(req.body);
    successResponse(res, guest, 'Guest created', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.update(req.params.id, req.body);
    successResponse(res, guest, 'Guest updated');
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string) || '';
    const propertyId = (req.query.propertyId as string) || req.user?.propertyId || '';
    const results = await guestsService.search(query, propertyId);
    successResponse(res, results);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await guestsService.getHistory(req.params.id);
    successResponse(res, history);
  } catch (err) {
    next(err);
  }
}
