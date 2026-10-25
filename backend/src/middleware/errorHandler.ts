import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
  });
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Handle malformed JSON body parser syntax errors
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload provided in request body.',
      },
    });
    return;
  }

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS error:')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: err.message,
      },
    });
    return;
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : ('statusCode' in err ? (err as { statusCode?: number }).statusCode || 500 : 500);
  const code = isAppError ? err.code : ('code' in err ? (err as { code?: string }).code || 'INTERNAL_SERVER_ERROR' : 'INTERNAL_SERVER_ERROR');
  const details = isAppError ? err.details : undefined;

  // Safe message in production for unhandled internal exceptions
  const message =
    config.nodeEnv === 'production' && statusCode === 500 && !isAppError
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'An unexpected server error occurred.';

  console.error(`[Error] [${req.method} ${req.url}] ${err.name}: ${err.message}`);
  if (config.nodeEnv === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    },
  });
};
