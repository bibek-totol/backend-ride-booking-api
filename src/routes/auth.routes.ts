import { Router } from 'express';

const router = Router();

// Example auth routes
router.get('/', (_req, res) => res.json({ message: 'auth root' }));

export default router;
