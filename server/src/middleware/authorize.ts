import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Middleware RBAC: verifica que el usuario autenticado
 * tenga uno de los roles permitidos.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(user.role as Role)) {
      res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
      return;
    }

    next();
  };
}
