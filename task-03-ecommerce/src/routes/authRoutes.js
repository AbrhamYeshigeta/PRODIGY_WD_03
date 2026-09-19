import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const passwordRule = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
  .matches(/[a-z]/).withMessage('Password needs a lowercase letter')
  .matches(/\d/).withMessage('Password needs a number');

router.post('/register',
  [body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
   body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
   passwordRule],
  validate, register);

router.post('/login',
  [body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
   body('password').notEmpty().withMessage('Password required')],
  validate, login);

router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;