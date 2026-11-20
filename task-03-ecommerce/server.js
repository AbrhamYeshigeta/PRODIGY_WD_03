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
const offerRoutes = require('./src/routes/offerRoutes.js');
const { notFound, errorHandler } = require('./src/middleware/error.js');
const { verifyToken } = require('./src/utils/token.js');

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

const protectedPages = new Set([
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/orders.html',
  '/order-detail.html',
]);

const getSafeRedirect = (candidate, fallback = '/') => {
  if (typeof candidate !== 'string'
    || !candidate.startsWith('/')
    || candidate.startsWith('//')
    || candidate.includes('\\')) {
    return fallback;
  }

  const url = new URL(candidate, 'http://localhost');
  if (url.origin !== 'http://localhost'
    || url.pathname === '/login.html'
    || url.pathname === '/register.html'
    || /^\/(seller|admin)(\/|$)/.test(url.pathname)) {
    return fallback;
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

/* Require a valid customer session before serving the buyer storefront. */
app.use((req, res, next) => {
  const isAuthRoute = req.path === '/login.html' || req.path === '/register.html';
  let isAuthenticated = false;

  if (req.cookies?.token) {
    try {
      verifyToken(req.cookies.token);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (protectedPages.has(req.path) && !isAuthenticated) {
    const returnTo = getSafeRedirect(`${req.path}${req.url.slice(req.path.length)}`);
    return res.redirect(`/login.html?redirect=${encodeURIComponent(returnTo)}`);
  }

  if (isAuthRoute && isAuthenticated) {
    return res.redirect(getSafeRedirect(req.query.redirect, '/'));
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
app.use('/api/auth/customer-login', authLimiter);
app.use('/api/auth/merchant-login', authLimiter);
app.use('/api/auth/register', authLimiter);

/* ============================================
   Routes
   ============================================ */
app.use('/api/auth', authRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);

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