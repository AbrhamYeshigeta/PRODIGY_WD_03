// src/app.js
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cookieParser = require('cookie-parser');
const path       = require('path');

const env         = require('./config/env');
const connectDB   = require('./config/db');
const routes      = require('./routes');
const notFound    = require('./middleware/notFound');
const errorHandler = require('./middleware/error');
const { completeDeliveredOrders } = require('./services/orderLifecycle');

const authRoutes   = require('./routes/authRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const app = express();

/* ── Core middleware ── */
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

/* ── Static files ── */
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: env.isProd ? '7d' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

/* ── Health check ── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });
});

/* ── API routes ── */
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/sellers', sellerRoutes);

/* ── 404 + error ── */
app.use(notFound);
app.use(errorHandler);

/* ── Boot ── */
async function start() {
  await connectDB();
  const lifecycleTimer = setInterval(() => {
    completeDeliveredOrders().catch((error) => {
      console.error('Delivered-order completion sweep failed:', error);
    });
  }, 60 * 1000);
  lifecycleTimer.unref();
  completeDeliveredOrders().catch((error) => {
    console.error('Initial delivered-order completion sweep failed:', error);
  });
  app.listen(env.port, () => {
    console.log(`\n🦬 Etfruit API running on port ${env.port} (${env.nodeEnv})`);
    console.log(`   → http://localhost:${env.port}/api/health\n`);
  });
}

if (require.main === module) start();

module.exports = app;