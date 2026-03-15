require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { generalLimiter }  = require('./rateLimit');
const { sanitizeInput }   = require('./sanitize');
const goalsRouter  = require('./goals');
const streakRouter = require('./streak');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'https://whats-next-dun.vercel.app',
      'https://whatsnf.vercel.app',
      'http://localhost:5500',
      'http://localhost:3000'
    ];
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all for now during testing
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors()); // handle preflight requests

app.use(express.json({ limit: '10kb' }));
app.use(generalLimiter);
app.use(sanitizeInput);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/goals',  goalsRouter);
app.use('/api/streak', streakRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
