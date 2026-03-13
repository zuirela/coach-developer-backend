// routes/coaches.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// GET /api/coaches
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, o.name as organization_name
       FROM coaches c
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.active = true
       ORDER BY c.name`,
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// GET /api/coaches/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, o.name as organization_name
       FROM coaches c
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE c.id = $1 AND c.active = true`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Valmentajaa ei löydy' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// POST /api/coaches
router.post('/', auth, async (req, res) => {
  const { name, email, team, club, level, organization_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Nimi vaaditaan' });
  const avatar = name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
  try {
    const result = await db.query(
      `INSERT INTO coaches (name, email, team, club, level, avatar, organization_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, email||null, team||null, club||null, level||'D', avatar,
       organization_id || req.user.organization_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// PUT /api/coaches/:id
router.put('/:id', auth, async (req, res) => {
  const { name, email, team, club, level } = req.body;
  try {
    const result = await db.query(
      `UPDATE coaches SET name=$1, email=$2, team=$3, club=$4, level=$5
       WHERE id=$6 AND active=true RETURNING *`,
      [name, email||null, team||null, club||null, level||'D', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Valmentajaa ei löydy' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// DELETE /api/coaches/:id  (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE coaches SET active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Valmentaja poistettu' });
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;
