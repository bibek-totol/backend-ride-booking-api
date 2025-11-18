import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getProfile, getUserById, updateProfile} from '../controllers/user.controller';

const router = Router();


router.get('/profile', authenticate, getProfile);
router.get('/:userId', getUserById);
router.patch('/profile', authenticate, updateProfile);



export default router;
