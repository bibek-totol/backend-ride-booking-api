import { Router } from 'express';

const router = Router();

// Example admin routes
router.get('/', (_req, res) => res.json({ message: 'admin root' }));

export default router;

