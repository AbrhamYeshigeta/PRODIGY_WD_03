// src/config/env.js
require('dotenv').config();

const required = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  process.exit(1);
}

module.exports = {
  nodeEnv:      process.env.NODE_ENV,
  port:         parseInt(process.env.PORT, 10) || 5000,
  mongoUri:     process.env.MONGO_URI,
  jwtSecret:    process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl:    process.env.CLIENT_URL || 'http://localhost:5500',

  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY,
    baseUrl:   process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
    callbackUrl: process.env.CHAPA_CALLBACK_URL,
    returnUrl:   process.env.CHAPA_RETURN_URL,
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Etfruit <noreply@etfruit.com>',
  },

  isProd: process.env.NODE_ENV === 'production',
};