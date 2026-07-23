import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Errores de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'Error interno del servidor';

  // Log detallado solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err);
  } else {
    console.error('🔥 Error:', err.message);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
