// routes/notifications.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]);
    res.json({ message: 'Merkitty luetuksi' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]);
    res.json({ message: 'Merkitty luetuksi' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

module.exports = router;
