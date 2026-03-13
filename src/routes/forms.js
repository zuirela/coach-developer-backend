// routes/forms.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT f.*, u.name as created_by_name
       FROM forms f
       LEFT JOIN users u ON u.id = f.created_by_id
       ORDER BY f.created_at DESC`
    );
    res.json(r.rows);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM forms WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.post('/', auth, async (req, res) => {
  const { name, criteria_ids, active } = req.body;
  if (!name) return res.status(400).json({ error: 'name vaaditaan' });
  try {
    const r = await db.query(
      `INSERT INTO forms (name, criteria_ids, active, created_by_id, organization_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, criteria_ids||[], active!==false, req.user.id, req.user.organization_id]
    );
    res.status(201).json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.put('/:id', auth, async (req, res) => {
  const { name, criteria_ids, active } = req.body;
  try {
    const r = await db.query(
      'UPDATE forms SET name=$1,criteria_ids=$2,active=$3 WHERE id=$4 RETURNING *',
      [name, criteria_ids||[], active!==false, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Ei löydy' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM forms WHERE id=$1', [req.params.id]);
    res.json({ message: 'Poistettu' });
  } catch { res.status(500).json({ error: 'Palvelinvirhe' }); }
});

module.exports = router;
