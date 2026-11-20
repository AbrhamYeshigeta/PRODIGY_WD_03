const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

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

const normalizeRegistrationName = (req, res, next) => {
  const submittedName = req.body?.name ?? req.body?.username;
  if (typeof submittedName === 'string') {
    req.body.name = submittedName.trim();
  }
  next();
};

router.post('/register',
  normalizeRegistrationName,
  [body('name').isString().withMessage('Full name is required').bail()
    .isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters'),
   body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
   passwordRule],
  validate, register);

const loginValidators = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/login', loginValidators, validate, login);
router.post('/customer-login', loginValidators, validate, (req, res, next) => {
  login(req, res, next, ['customer']);
});
router.post('/merchant-login', loginValidators, validate, (req, res, next) => {
  login(req, res, next, ['seller', 'admin']);
});

router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;