import { z } from 'zod';

export const createFavoriteSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  address: z.string().min(3, 'Dirección requerida').max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  icon: z.string().max(5).optional(),
});

export const updateFavoriteSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  address: z.string().min(3).max(200).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  icon: z.string().max(5).optional(),
});

export const favoriteIdSchema = z.object({
  favoriteId: z.string().uuid(),
});

export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteSchema>;
