// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const authRoutes = require('./src/routes/authRoutes.js');
const sellerRoutes = require('./src/routes/sellerRoutes.js');
const cartRoutes = require('./src/routes/cartRoutes.js');
const productRoutes = require('./src/routes/productRoutes.js');
const { notFound, errorHandler } = require('./src/middleware/error.js');

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
app.use(morgan('dev'));

/* Public storefront, gated actions: keep default landing page open while protecting cart and order pages */
app.use((req, res, next) => {
  const protectedPages = ['/cart.html', '/orders.html'];
  const isAuthRoute = req.path === '/login.html' || req.path === '/register.html';
  const isProtectedPage = protectedPages.includes(req.path);
  

  if (isProtectedPage && !req.cookies?.token) {
    return res.redirect('/login.html');
  }

  if (isAuthRoute && req.cookies?.token) {
    return res.redirect('/index.html');
  }

  next();
});

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
app.use('/api/sellers', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);

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

const start = () => {
  // 🚨 MONGODB CONNECT REMOVED. PRISMA CONNECTS AUTOMATICALLY ON FIRST QUERY.
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
};

start();