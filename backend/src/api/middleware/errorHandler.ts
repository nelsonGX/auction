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
    const response: any = {
      status: 'error',
      message: err.message
    };
    
    // Include error details if available and we're in development
    if (err.details && (process.env.NODE_ENV === 'development' || process.env.DEBUG_ERRORS === 'true')) {
      response.details = err.details;
    }
    
    return res.status(err.statusCode).json(response);
  }

  // For unexpected errors, send a generic error message
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};