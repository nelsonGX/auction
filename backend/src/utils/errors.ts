export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found Error
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Bad Request Error
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

// Unauthorized Error
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: any) {
    super(message, 401, true, details);
  }
}

// Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

// Conflict Error
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}