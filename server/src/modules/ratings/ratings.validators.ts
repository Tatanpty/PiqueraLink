import { z } from 'zod';

export const createReviewSchema = z.object({
  tripId: z.string().uuid('ID de viaje debe ser UUID'),
  rating: z.number().int().min(1, 'Mínimo 1 estrella').max(5, 'Máximo 5 estrellas'),
  comment: z.string().max(500, 'El comentario no puede exceder 500 caracteres').optional(),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
