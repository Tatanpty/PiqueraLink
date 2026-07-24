import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import queueRoutes from './modules/queue/queue.routes';
import tripRoutes from './modules/trips/trips.routes';
import piqueraRoutes from './modules/piqueras/piqueras.routes';
import globalAdminRoutes from './modules/global-admin/global-admin.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import locationRoutes from './modules/geospatial/location.routes';
import sosRoutes from './modules/sos/sos.routes';
import ratingsRoutes from './modules/ratings/ratings.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import tripShareRoutes from './modules/trip-share/trip-share.routes';
import lostItemsRoutes from './modules/lost-items/lost-items.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import adminToolsRoutes from './modules/admin-tools/admin-tools.routes';
import fareRoutes from './modules/payments/fare.routes';
import driverAnalyticsRoutes from './modules/driver-analytics/driver-analytics.routes';
import promosRoutes from './modules/promos/promos.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import { initQueueEvents } from './modules/queue/queue.events';
import { initTripEvents } from './modules/trips/trips.events';
import { initLocationEvents } from './modules/geospatial/location.events';
import { initSOSEvents } from './modules/sos/sos.events';
import { initLostItemEvents } from './modules/lost-items/lost-items.events';
import { initNotificationService } from './modules/notifications/notification.service';

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
app.use('/api/trips', tripShareRoutes); // Share routes primero (tiene ruta pública)
app.use('/api/trips', tripRoutes);
app.use('/api/piqueras', piqueraRoutes);
app.use('/api/global-admin', globalAdminRoutes);
app.use('/api/admin/metrics', metricsRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/lost-items', lostItemsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminToolsRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/drivers', driverAnalyticsRoutes);
app.use('/api/promos', promosRoutes);
app.use('/api/notifications', notificationRoutes);

// ========================
// Socket.IO - Conexiones
// ========================
// Inicializar eventos de módulos con Socket.IO
initQueueEvents(io);
initTripEvents(io);
initLocationEvents(io);
initSOSEvents(io);
initLostItemEvents(io);
initNotificationService(io);

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

  // Unirse a sala de administradores (para recibir alertas SOS)
  socket.on('join:admins', () => {
    socket.join('admins');
    console.log(`🛡️ ${socket.id} se unió a sala admins`);
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
