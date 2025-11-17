import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getProfile, getUserById} from '../controllers/user.controller';

const router = Router();


router.get('/profile', authenticate, getProfile);
router.get('/:userId', getUserById);



export default router;
