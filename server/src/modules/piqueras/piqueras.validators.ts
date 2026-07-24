import { z } from 'zod';

export const nearbyQuerySchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, 'Latitud debe ser >= -90')
    .max(90, 'Latitud debe ser <= 90'),
  lng: z.coerce
    .number()
    .min(-180, 'Longitud debe ser >= -180')
    .max(180, 'Longitud debe ser <= 180'),
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
