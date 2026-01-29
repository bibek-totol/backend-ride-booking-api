import { Router } from 'express';
import { register, login, refreshToken, logout, googleCallback, verifyLoginOtp, resendOtp } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import passport from "passport";

const router = Router();


router.post('/register', register);


router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/resend-otp', resendOtp);

router.get("/google", (req, res, next) => {
  // Get role from query parameter, default to "rider"
  const role = (req.query.role as string) || "rider";

  // Encode role in state parameter for OAuth flow
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
    state: state
  })(req, res, next);
});


router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  googleCallback
);



router.post('/refresh', refreshToken);

router.post('/logout', authenticate, logout);

export default router;
