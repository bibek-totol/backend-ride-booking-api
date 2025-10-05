import { Router } from 'express';

const router = Router();

// Example rider routes
router.get('/', (_req, res) => res.json({ message: 'riders root' }));

export default router;

