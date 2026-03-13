// routes/selfassessments.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { coachId } = req.query;
  const where  = coachId ? 'WHERE coach_id=$1' : '';
  const params = coachId ? [coachId] : [];
  try {
    const r = await db.query(
      `SELECT * FROM self_assessments ${where} ORDER BY date DESC`, params
    );
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.post('/', auth, async (req, res) => {
  const { coach_id, date, ratings, reflection } = req.body;
  if (!coach_id) return res.status(400).json({ error: 'coach_id vaaditaan' });
  try {
    const r = await db.query(
      `INSERT INTO self_assessments (coach_id, user_id, date, ratings, reflection)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [coach_id, req.user.id, date||new Date().toISOString().split('T')[0],
       JSON.stringify(ratings||{}), reflection||null]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM self_assessments WHERE id=$1', [req.params.id]);
    res.json({ message: 'Poistettu' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

module.exports = router;
