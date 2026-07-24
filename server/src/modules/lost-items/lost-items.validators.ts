import { z } from 'zod';

export const createLostItemSchema = z.object({
  tripId: z.string().uuid('ID de viaje debe ser UUID'),
  description: z.string().min(5, 'Describe el objeto (mín. 5 caracteres)').max(500),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'returned', 'closed'], {
    errorMap: () => ({ message: 'Estado debe ser: pending, returned o closed' }),
  }),
});

export const lostItemIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateLostItemInput = z.infer<typeof createLostItemSchema>;
