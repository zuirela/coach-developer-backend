// routes/criteria.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM criteria WHERE active=true ORDER BY category, id');
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.post('/', auth, async (req, res) => {
  const { name, description, category, source } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name ja category vaaditaan' });
  try {
    const r = await db.query(
      `INSERT INTO criteria (name, description, category, source, organization_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description||null, category, source||'liitto', req.user.organization_id]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.put('/:id', auth, async (req, res) => {
  const { name, description, category, source } = req.body;
  try {
    const r = await db.query(
      'UPDATE criteria SET name=$1,description=$2,category=$3,source=$4 WHERE id=$5 RETURNING *',
      [name, description||null, category, source||'liitto', req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('UPDATE criteria SET active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Poistettu' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

module.exports = router;
