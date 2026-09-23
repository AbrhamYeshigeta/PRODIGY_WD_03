import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import { notFound, errorHandler } from './src/middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/* ============================================
   Security headers — CSP tuned for our stack
   ============================================ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ['https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan('dev'));

/* ============================================
   Static files — no caching during dev
   ============================================ */
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (/\.(html|js|css)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      }
    },
  })
);

/* Redirect root to login page */
app.get('/', (req, res) => res.redirect('/index.html'));

/* ============================================
   Rate limiting
   ============================================ */
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

/* ============================================
   Routes
   ============================================ */
app.use('/api/auth', authRoutes);

/* Placeholder routes — return empty data until Block 2 ships the real models */
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0, limit: 20 } });
});

app.get('/api/cart', (req, res) => {
  res.json({ success: true, data: { items: [], subtotal: 0, total: 0 } });
});

app.post('/api/cart/items', (req, res) => {
  res.status(503).json({ success: false, message: 'Cart API coming in the next block' });
});

app.get('/api/health', (req, res) => res.json({ success: true }));

/* ============================================
   Errors
   ============================================ */
app.use(notFound);
app.use(errorHandler);

/* ============================================
   Boot
   ============================================ */
const PORT = process.env.PORT || 5003;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
};

start();