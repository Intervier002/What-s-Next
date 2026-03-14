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
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
