import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.validators';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registro público de usuario.
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Autenticación con email y contraseña.
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);

      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Renovar token JWT (requiere autenticación).
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await authService.refreshToken(userId);

      res.status(200).json({
        message: 'Token renovado',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
