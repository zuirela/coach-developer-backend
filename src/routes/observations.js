// routes/observations.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/observations?coachId=X
router.get('/', auth, async (req, res) => {
  const { coachId } = req.query;
  const where = coachId ? 'WHERE o.coach_id = $1' : '';
  const params = coachId ? [coachId] : [];
  try {
    const result = await db.query(
      `SELECT o.*,
              c.name as coach_name, c.team as coach_team, c.avatar as coach_avatar, c.level as coach_level,
              f.name as form_name
       FROM observations o
       LEFT JOIN coaches c ON c.id = o.coach_id
       LEFT JOIN forms   f ON f.id = o.form_id
       ${where}
       ORDER BY o.date DESC, o.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// GET /api/observations/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*,
              c.name as coach_name, c.team as coach_team, c.avatar as coach_avatar,
              f.name as form_name
       FROM observations o
       LEFT JOIN coaches c ON c.id = o.coach_id
       LEFT JOIN forms   f ON f.id = o.form_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Havainnointia ei löydy' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// POST /api/observations
router.post('/', auth, async (req, res) => {
  const { coach_id, form_id, date, location, notes, ratings, counters } = req.body;
  if (!coach_id || !date) return res.status(400).json({ error: 'coach_id ja date vaaditaan' });
  try {
    const result = await db.query(
      `INSERT INTO observations (coach_id, form_id, observer_id, observer_name, date, location, notes, ratings, counters)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [coach_id, form_id||null, req.user.id, req.user.name||null,
       date, location||null, notes||null,
       JSON.stringify(ratings||{}), JSON.stringify(counters||{})]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// DELETE /api/observations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM observations WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Havainnointia ei löydy' });
    res.json({ message: 'Poistettu' });
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;
