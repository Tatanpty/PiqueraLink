import { z } from 'zod';

export const piqueraIdParamSchema = z.object({
  piqueraId: z.string().uuid('ID de piquera debe ser un UUID válido'),
});

export type PiqueraIdParam = z.infer<typeof piqueraIdParamSchema>;
