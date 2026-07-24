import { Router } from 'express';
import { globalAdminController } from './global-admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize('super_admin'));

router.get('/overview', (req, res, next) => globalAdminController.getOverview(req, res, next));
router.get('/piqueras', (req, res, next) => globalAdminController.getAllPiqueras(req, res, next));
router.get('/piqueras/:piqueraId', (req, res, next) => globalAdminController.getPiqueraDetail(req, res, next));

export default router;
