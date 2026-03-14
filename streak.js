const express = require('express');
const router  = express.Router();
const { db }  = require('../firebase');
const verifyToken      = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');

// GET /api/streak — get streak for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const doc = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('streak')
      .doc('data')
      .get();

    if (!doc.exists) {
      return res.json({ current: 0, longest: 0, lastDate: null });
    }

    const { current, longest, lastDate } = doc.data();
    res.json({ current: current||0, longest: longest||0, lastDate: lastDate||null });

  } catch (err) {
    console.error('GET /streak error:', err);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// POST /api/streak/action — record a completed action, update streak
router.post('/action', verifyToken, writeLimiter, async (req, res) => {
  try {
    const streakRef = db
      .collection('users')
      .doc(req.user.uid)
      .collection('streak')
      .doc('data');

    const doc = await streakRef.get();
    let { current=0, longest=0, lastDate=null } = doc.exists ? doc.data() : {};

    const today     = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Don't double-count same day
    if (lastDate === today) {
      return res.json({ current, longest, lastDate, alreadyCounted: true });
    }

    // Extend or reset streak
    if (lastDate === yesterdayStr) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > longest) longest = current;
    lastDate = today;

    await streakRef.set({ current, longest, lastDate, updatedAt: new Date() });

    // Also log the action
    await db
      .collection('users')
      .doc(req.user.uid)
      .collection('actionsLog')
      .add({
        goal:        req.body.goal        || '',
        action:      req.body.action      || '',
        completedAt: new Date(),
      });

    res.json({ current, longest, lastDate });

  } catch (err) {
    console.error('POST /streak/action error:', err);
    res.status(500).json({ error: 'Failed to record action' });
  }
});

module.exports = router;
