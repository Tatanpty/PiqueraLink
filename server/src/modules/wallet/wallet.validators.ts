import { z } from 'zod';

export const withdrawSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0').max(10000, 'Monto máximo por retiro: $10,000'),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;
