import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import queueRoutes from './modules/queue/queue.routes';
import tripRoutes from './modules/trips/trips.routes';
import { initQueueEvents } from './modules/queue/queue.events';
import { initTripEvents } from './modules/trips/trips.events';

// Inicializar Express
const app = express();
const httpServer = createServer(app);

// Inicializar Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.SOCKET_CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ========================
// Middlewares Globales
// ========================
app.use(cors({ origin: env.SOCKET_CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// Health Check
// ========================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ========================
// Rutas de la API
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/trips', tripRoutes);
// TODO: Módulos pendientes
// app.use('/api/admin', adminRoutes);
// app.use('/api/piqueras', piqueraRoutes);

// ========================
// Socket.IO - Conexiones
// ========================
// Inicializar eventos de módulos con Socket.IO
initQueueEvents(io);
initTripEvents(io);

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Unirse a sala de piquera específica
  socket.on('join:piquera', (piqueraId: string) => {
    socket.join(`piquera:${piqueraId}`);
    console.log(`📍 ${socket.id} se unió a piquera:${piqueraId}`);
  });

  // Unirse a sala personal (conductor o pasajero)
  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`👤 ${socket.id} se unió a user:${userId}`);
  });

  // Unirse a sala de un viaje específico
  socket.on('join:trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    console.log(`🚗 ${socket.id} se unió a trip:${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ========================
// Manejo Global de Errores
// ========================
app.use(errorHandler);

// ========================
// Iniciar Servidor
// ========================
httpServer.listen(env.PORT, () => {
  console.log(`
  🚕 PiqueraLink Server
  ─────────────────────────────
  📡 Puerto:     ${env.PORT}
  🌍 Entorno:    ${env.NODE_ENV}
  🔌 Socket.IO:  Activo
  🗄️  DB:         Conectada vía Prisma
  ─────────────────────────────
  `);
});

// Exportar para tests
export { app, io, httpServer };
