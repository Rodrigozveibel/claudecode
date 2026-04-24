import { Response, NextFunction } from 'express';
import * as propertiesService from './properties.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export async function createProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const property = await propertiesService.createProperty(req.body);
    successResponse(res, property, 'Property created', 201);
  } catch (error) {
    next(error);
  }
}

export async function getProperties(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { items, total, page, limit } = await propertiesService.getProperties(req);
    paginatedResponse(res, items, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getPropertyById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const property = await propertiesService.getPropertyById(req.params.id);
    successResponse(res, property);
  } catch (error) {
    next(error);
  }
}

export async function updateProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const property = await propertiesService.updateProperty(req.params.id, req.body);
    successResponse(res, property, 'Property updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await propertiesService.deleteProperty(req.params.id);
    successResponse(res, null, 'Property deactivated');
  } catch (error) {
    next(error);
  }
}

export async function getPropertySettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await propertiesService.getPropertySettings(req.params.id);
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function updatePropertySettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await propertiesService.updatePropertySettings(req.params.id, req.body);
    successResponse(res, settings, 'Settings updated');
  } catch (error) {
    next(error);
  }
}
