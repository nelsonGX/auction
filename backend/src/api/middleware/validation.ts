import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { BadRequestError } from '../../utils/errors';

// Middleware to handle validation errors
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check if there are validation errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    // If there are validation errors, format them and return as a BadRequestError
    const errorMessages = errors.array().map(error => {
      if ('msg' in error) {
        return `${error.msg} ${'param' in error && error.param ? `(${error.param})` : ''}`;
      }
      return 'Unknown validation error';
    });
    
    next(new BadRequestError(errorMessages.join(', ')));
  };
};

// Middleware to check if user is a host
export const isHost = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.isHost !== true) {
    return next(new BadRequestError('Only hosts can perform this action'));
  }
  next();
};