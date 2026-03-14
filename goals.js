const express  = require('express');
const router   = express.Router();
const { db }   = require('../firebase');
const verifyToken            = require('../middleware/auth');
const { sanitizeString }     = require('../middleware/sanitize');
const { writeLimiter }       = require('../middleware/rateLimit');

// GET /api/goals — get all goals for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection('users')
      .doc(req.user.uid)
      .collection('goals')
      .orderBy('createdAt', 'asc')
      .get();

    const goals = snapshot.docs.map(doc => ({
      id:    doc.id,
      title: doc.data().title,
    }));

    res.json({ goals });
  } catch (err) {
    console.error('GET /goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals — save goals (replaces all existing)
router.post('/', verifyToken, writeLimiter, async (req, res) => {
  try {
    const { goals } = req.body;

    // Validate
    if (!Array.isArray(goals)) {
      return res.status(400).json({ error: 'Goals must be an array' });
    }
    if (goals.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 goals allowed' });
    }
    if (goals.length === 0) {
      return res.status(400).json({ error: 'At least one goal is required' });
    }

    // Sanitize each goal
    const cleanGoals = goals
      .map(sanitizeString)
      .filter(g => g.length > 0);

    if (cleanGoals.length === 0) {
      return res.status(400).json({ error: 'No valid goals after sanitization' });
    }

    const userRef = db.collection('users').doc(req.user.uid);
    const goalsRef = userRef.collection('goals');

    // Delete existing goals
    const existing = await goalsRef.get();
    const batch = db.batch();
    existing.docs.forEach(doc => batch.delete(doc.ref));

    // Add new goals
    cleanGoals.forEach(title => {
      const newRef = goalsRef.doc();
      batch.set(newRef, {
        title,
        createdAt: new Date(),
      });
    });

    await batch.commit();
    res.json({ success: true, goals: cleanGoals });

  } catch (err) {
    console.error('POST /goals error:', err);
    res.status(500).json({ error: 'Failed to save goals' });
  }
});

// DELETE /api/goals — delete all goals
router.delete('/', verifyToken, writeLimiter, async (req, res) => {
  try {
    const goalsRef = db.collection('users').doc(req.user.uid).collection('goals');
    const existing = await goalsRef.get();
    const batch = db.batch();
    existing.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /goals error:', err);
    res.status(500).json({ error: 'Failed to delete goals' });
  }
});

module.exports = router;
