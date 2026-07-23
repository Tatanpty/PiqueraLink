import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables desde .env
dotenv.config();

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida de PostgreSQL'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Servidor
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Socket.IO
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Almacenamiento (opcional)
  STORAGE_BUCKET_URL: z.string().optional(),
});

// Validar y exportar configuración tipada
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Variables de entorno inválidas:',
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
