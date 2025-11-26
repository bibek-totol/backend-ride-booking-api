import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import {checkApproval} from '../middleware/checkApproval.middleware';
import { acceptRide, getAllRides, getDriverEarnings, rejectRide, setAvailability, updateRideStatus } from '../controllers/driver.controller';

const router = Router();

const { authenticate, authorize } = authMiddleware;


router.put('/:id/accept', authenticate, authorize(['driver']),checkApproval, acceptRide);


router.post('/:id/reject', authenticate, authorize(['driver']),checkApproval, rejectRide);


router.post('/:id/status', authenticate, authorize(['driver']),checkApproval,updateRideStatus);


router.post('/availability', authenticate, authorize(['driver']),checkApproval, setAvailability);


router.get('/earnings', authenticate, authorize(['driver']),checkApproval, getDriverEarnings);

router.get('/rides', authenticate, authorize(['driver']),checkApproval, getAllRides);




export default router;

