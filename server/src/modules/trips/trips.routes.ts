import { Router } from 'express';
import { tripsController } from './trips.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Pasajero solicita viaje
router.post(
  '/request',
  authorize('passenger'),
  (req, res, next) => tripsController.requestTrip(req, res, next)
);

// Conductor acepta viaje
router.patch(
  '/:tripId/accept',
  authorize('driver'),
  (req, res, next) => tripsController.acceptTrip(req, res, next)
);

// Conductor rechaza viaje
router.patch(
  '/:tripId/reject',
  authorize('driver'),
  (req, res, next) => tripsController.rejectTrip(req, res, next)
);

// Conductor completa viaje
router.patch(
  '/:tripId/complete',
  authorize('driver'),
  (req, res, next) => tripsController.completeTrip(req, res, next)
);

// Consultar estado del viaje (pasajero o conductor)
router.get(
  '/:tripId/status',
  authorize('passenger', 'driver'),
  (req, res, next) => tripsController.getTripStatus(req, res, next)
);

export default router;
