import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthPayload } from '../middleware/authenticate';

/**
 * Verificar y decodificar un token JWT.
 * Útil para validar tokens en conexiones Socket.IO.
 */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}

/**
 * Extraer token de un header Authorization.
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
