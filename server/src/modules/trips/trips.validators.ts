import { z } from 'zod';

export const createTripSchema = z.object({
  piqueraId: z.string().uuid('ID de piquera debe ser un UUID válido'),
  originLat: z
    .number()
    .min(-90, 'Latitud debe ser >= -90')
    .max(90, 'Latitud debe ser <= 90'),
  originLng: z
    .number()
    .min(-180, 'Longitud debe ser >= -180')
    .max(180, 'Longitud debe ser <= 180'),
  destination: z
    .string()
    .min(3, 'El destino debe tener al menos 3 caracteres')
    .max(200, 'El destino no puede exceder 200 caracteres'),
  destinationLat: z.number().min(-90).max(90).optional(),
  destinationLng: z.number().min(-180).max(180).optional(),
  promoCode: z.string().max(20).optional(),
});

export const tripIdParamSchema = z.object({
  tripId: z.string().uuid('ID de viaje debe ser un UUID válido'),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type TripIdParam = z.infer<typeof tripIdParamSchema>;
