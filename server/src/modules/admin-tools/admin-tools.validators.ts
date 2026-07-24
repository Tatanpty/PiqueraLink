import { z } from 'zod';

export const exportReportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  piqueraId: z.string().uuid().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned'], {
    errorMap: () => ({ message: 'Estado debe ser: active, suspended o banned' }),
  }),
  reason: z.string().min(3, 'Se requiere un motivo').max(300).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
