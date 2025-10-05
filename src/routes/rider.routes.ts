import { Router } from 'express';
import auth from '../middleware/auth.middleware';
import { cancelRide, getRide, getRideHistory, requestRide } from '../controllers/rider.controller';

const router = Router();


router.post('/request', auth.authenticate, requestRide);
router.post('/:id/cancel', auth.authenticate, cancelRide);
router.get('/history', auth.authenticate, getRideHistory);
router.get('/:id', auth.authenticate, getRide);

export default router;

