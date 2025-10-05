import { Router } from 'express';

const router = Router();

// Example driver routes
router.get('/', (_req, res) => res.json({ message: 'drivers root' }));

export default router;

