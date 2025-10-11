import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getProfile, getRide, getRides } from '../controllers/user.controller';

const router = Router();


router.get('/profile', authenticate, getProfile);


router.get('/rides', authenticate, getRides);


router.get('/rides/:id', authenticate,getRide);

export default router;
