import { z } from 'zod';

export const triggerSOSSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(['panic', 'accident', 'robbery', 'medical', 'other']),
  tripId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export const alertIdSchema = z.object({
  alertId: z.string().uuid('ID de alerta debe ser UUID válido'),
});

export const resolveSchema = z.object({
  isFalseAlarm: z.boolean().optional().default(false),
});

export type TriggerSOSInput = z.infer<typeof triggerSOSSchema>;
