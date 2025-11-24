import { Router } from 'express';
import { register, login, refreshToken, logout, googleCallback } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import passport from "passport";

const router = Router();


router.post('/register', register);


router.post('/login', login);

router.get("/google", (req, res, next) => {
  (req.session as any).role = req.query.role as string | undefined;
  passport.authenticate("google", { scope: ["profile", "email"], session: true })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  googleCallback
);



router.post('/refresh', refreshToken);

router.post('/logout', authenticate, logout);

export default router;
