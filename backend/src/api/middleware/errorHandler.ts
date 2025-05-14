import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  });

  // If it's an operational error (expected error), send the appropriate response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // For unexpected errors, send a generic error message
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};