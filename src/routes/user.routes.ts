import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getProfile} from '../controllers/user.controller';

const router = Router();


router.get('/profile', authenticate, getProfile);



export default router;
