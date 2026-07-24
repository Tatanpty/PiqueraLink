import { Router, Request, Response, NextFunction } from 'express';
import { promosService } from './promos.service';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const validatePromoSchema = z.object({
  code: z.string().min(3).max(20),
  fareAmount: z.number().positive(),
});

const createPromoSchema = z.object({
  code: z.string().min(3).max(20),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  usageLimit: z.number().int().positive().optional(),
  minFare: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  expiresAt: z.coerce.date(),
});

/**
 * POST /api/promos/validate
 * Validar un código promocional y obtener descuento calculado.
 */
router.post(
  '/validate',
  authorize('passenger'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, fareAmount } = validatePromoSchema.parse(req.body);
      const userId = req.user!.userId;

      const result = await promosService.applyPromoCode(code, userId, fareAmount);

      if (!result) {
        res.status(400).json({ error: 'Código no válido, expirado o ya utilizado' });
        return;
      }

      res.status(200).json({
        message: 'Código aplicado',
        ...result,
        newTotal: Math.round((fareAmount - result.discount) * 100) / 100,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/promos
 * Crear código promocional (admin/super_admin).
 */
router.post(
  '/',
  authorize('admin', 'super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createPromoSchema.parse(req.body);
      const promo = await promosService.createPromoCode(data);
      res.status(201).json({ message: 'Código promocional creado', promo });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/promos
 * Listar códigos promocionales (admin/super_admin).
 */
router.get(
  '/',
  authorize('admin', 'super_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const promos = await promosService.listPromoCodes();
      res.status(200).json(promos);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
