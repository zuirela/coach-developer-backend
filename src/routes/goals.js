// routes/goals.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { coachId } = req.query;
  const where  = coachId ? 'WHERE g.coach_id=$1' : '';
  const params = coachId ? [coachId] : [];
  try {
    const r = await db.query(
      `SELECT g.*, c.name as coach_name, c.team as coach_team, c.avatar as coach_avatar
       FROM goals g
       LEFT JOIN coaches c ON c.id = g.coach_id
       ${where}
       ORDER BY g.done, g.deadline NULLS LAST, g.created_at DESC`,
      params
    );
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.post('/', auth, async (req, res) => {
  const { coach_id, title, description, deadline, progress } = req.body;
  if (!coach_id || !title) return res.status(400).json({ error: 'coach_id ja title vaaditaan' });
  const prog = parseInt(progress||0);
  try {
    const r = await db.query(
      `INSERT INTO goals (coach_id, title, description, deadline, progress, done, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [coach_id, title, description||null, deadline||null, prog, prog===100, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.put('/:id', auth, async (req, res) => {
  const { title, description, deadline, progress, done, comments } = req.body;
  const prog = parseInt(progress ?? 0);
  try {
    const r = await db.query(
      `UPDATE goals SET title=$1,description=$2,deadline=$3,progress=$4,done=$5,comments=$6,updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, description||null, deadline||null, prog, done||prog===100,
       JSON.stringify(comments||[]), req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

// PATCH /api/goals/:id/progress
router.patch('/:id/progress', auth, async (req, res) => {
  const { progress } = req.body;
  const prog = parseInt(progress??0);
  try {
    const r = await db.query(
      'UPDATE goals SET progress=$1,done=$2,updated_at=NOW() WHERE id=$3 RETURNING *',
      [prog, prog===100, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

// POST /api/goals/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text vaaditaan' });
  try {
    const current = await db.query('SELECT comments FROM goals WHERE id=$1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    const comments = current.rows[0].comments || [];
    comments.push({ text, date: new Date().toISOString().split('T')[0], user: req.user.name });
    const r = await db.query(
      'UPDATE goals SET comments=$1,updated_at=NOW() WHERE id=$2 RETURNING *',
      [JSON.stringify(comments), req.params.id]
    );
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM goals WHERE id=$1', [req.params.id]);
    res.json({ message: 'Poistettu' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

module.exports = router;
