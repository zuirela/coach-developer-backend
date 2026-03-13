// index.js – Coach Developer Tool API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Terveyspiste (Render keepalive) ────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API-reitit ─────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/coaches',         require('./routes/coaches'));
app.use('/api/observations',    require('./routes/observations'));
app.use('/api/criteria',        require('./routes/criteria'));
app.use('/api/forms',           require('./routes/forms'));
app.use('/api/goals',           require('./routes/goals'));
app.use('/api/selfassessments', require('./routes/selfassessments'));
app.use('/api/notifications',   require('./routes/notifications'));

// ── API-info ───────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name:    'Coach Developer Tool API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET  /api/auth/me',
      'GET  /api/coaches',
      'GET  /api/observations',
      'GET  /api/criteria',
      'GET  /api/forms',
      'GET  /api/goals',
      'GET  /api/selfassessments',
      'GET  /api/notifications',
    ]
  });
});

// ── 404 ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Reittiä ei löydy: ${req.method} ${req.path}` });
});

// ── Virheenkäsittely ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Sisäinen palvelinvirhe' });
});

// ── Käynnistys ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏒 Coach Developer API käynnissä portissa ${PORT}`);
  console.log(`   Ympäristö: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
