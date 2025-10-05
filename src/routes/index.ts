import { Router } from 'express';
import authRoutes from './auth.routes';
import driverRoutes from './driver.routes';
import riderRoutes from './rider.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/riders', riderRoutes);
router.use('/admin', adminRoutes);

export default router;
