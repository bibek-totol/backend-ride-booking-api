import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { changePassword, getProfile, getUserById, sendPasswordOtp, updateProfile, verifyPasswordOtp} from '../controllers/user.controller';

const router = Router();


router.get('/profile', authenticate, getProfile);
router.get('/:userId', getUserById);
router.patch('/profile', authenticate, updateProfile);

router.post('/password/otp', authenticate, sendPasswordOtp);
router.post('/password/otp/verify', authenticate, verifyPasswordOtp);
router.patch('/password', authenticate, changePassword);



export default router;
