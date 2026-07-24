import { Router, Request, Response, NextFunction } from 'express';
import { favoritesController } from './favorites.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('passenger'));

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  favoritesController.getAll(req, res, next)
);

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  favoritesController.create(req, res, next)
);

router.patch('/:favoriteId', (req: Request, res: Response, next: NextFunction) =>
  favoritesController.update(req, res, next)
);

router.delete('/:favoriteId', (req: Request, res: Response, next: NextFunction) =>
  favoritesController.delete(req, res, next)
);

export default router;
