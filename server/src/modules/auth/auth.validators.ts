import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('Debe ser un email válido')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  role: z.enum(['passenger', 'driver', 'admin'], {
    errorMap: () => ({ message: 'Rol debe ser: passenger, driver o admin' }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Debe ser un email válido')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
