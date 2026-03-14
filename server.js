require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { generalLimiter }  = require('./middleware/rateLimit');
const { sanitizeInput }   = require('./middleware/sanitize');
const goalsRouter  = require('./routes/goals');
const streakRouter = require('./routes/streak');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS — only allow your frontend ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING ──
app.use(express.json({ limit: '10kb' })); // reject huge payloads

// ── GLOBAL MIDDLEWARE ──
app.use(generalLimiter);   // rate limit all routes
app.use(sanitizeInput);    // sanitize all input

// ── HEALTH CHECK ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── ROUTES ──
app.use('/api/goals',  goalsRouter);
app.use('/api/streak', streakRouter);

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
