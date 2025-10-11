import { Router } from 'express';
import { register, login, refreshToken, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();


router.post('/register', register);


router.post('/login', login);


router.post('/refresh', refreshToken);

router.post('/logout', authenticate, logout);

export default router;
