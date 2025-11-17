import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { acceptRide, getAllRides, getEarningsHistory, rejectRide, setAvailability, updateRideStatus } from '../controllers/driver.controller';

const router = Router();

const { authenticate, authorize } = authMiddleware;


router.put('/:id/accept', authenticate, authorize(['driver']), acceptRide);


router.post('/:id/reject', authenticate, authorize(['driver']), rejectRide);


router.post('/:id/status', authenticate, authorize(['driver']),updateRideStatus);


router.post('/availability', authenticate, authorize(['driver']), setAvailability);


router.get('/earnings', authenticate, authorize(['driver']), getEarningsHistory);

router.get('/rides', authenticate, authorize(['driver']), getAllRides);

export default router;

