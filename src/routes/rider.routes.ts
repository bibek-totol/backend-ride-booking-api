import { Router } from 'express';

import { cancelRide, getRide, getRideHistory, requestRide } from '../controllers/rider.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();


router.post('/request', authenticate,authorize(['rider']), requestRide);
router.post('/:id/cancel', authenticate,authorize(['rider']), cancelRide);
router.get('/history', authenticate,authorize(['rider']), getRideHistory);
router.get('/:id', authenticate,authorize(['rider']), getRide);

export default router;

