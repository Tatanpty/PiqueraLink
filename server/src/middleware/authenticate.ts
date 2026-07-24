import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin' | 'super_admin';
}

// Extender Request de Express para incluir usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;

    // Verificar que la cuenta no esté bloqueada (async check)
    prisma.user
      .findUnique({ where: { id: payload.userId }, select: { accountStatus: true } })
      .then((user) => {
        if (user && user.accountStatus !== 'active') {
          res.status(403).json({
            error: `Cuenta ${user.accountStatus === 'suspended' ? 'suspendida' : 'bloqueada'}. Contacta al administrador.`,
          });
          return;
        }
        next();
      })
      .catch(() => {
        next(); // Si falla el check, dejar pasar (fail open para no bloquear sistema)
      });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
