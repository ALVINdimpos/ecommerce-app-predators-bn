import { Router } from 'express';
import passport from 'passport';
import Jwt from '../utils/jwt';
import { googlePass } from '../utils/passport';
import { googleAuthHandler } from '../controller/authController';
import profileController from '../controller/profileController.js';
const router = Router();
// Google routes
googlePass();
router.get('/callback', (req, res) => {
    if (req.query.key) {
      const user = Jwt.verifyToken(req.query.key);
      return res
        .status(200)
        .json({ message: 'Thanks for logging in', user: user,token: req.query.key });
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  });
  router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
  );
  
  router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/',
    }),
    googleAuthHandler
  );
  router.get('/profiles', profileController.getUserProfile);
  router.get('/profiles/:id', profileController.getUserById);
  router.patch('/profile/:id', profileController.updateUserProfile);
export default router;
