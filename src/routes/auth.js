// routes/auth.js – Rekisteröinti ja kirjautuminen
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db      = require('../db');
const auth    = require('../middleware/auth');

// Tokenin luonti
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, organization_id: user.organization_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND active = true',
        [email]
      );
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: 'Väärä sähköposti tai salasana' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Väärä sähköposti tai salasana' });

      const token = signToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Palvelinvirhe' });
    }
  }
);

// POST /api/auth/register
router.post('/register',
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['liitto','seura','valmentaja']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, organization_id } = req.body;
    try {
      const exists = await db.query('SELECT id FROM users WHERE email=$1', [email]);
      if (exists.rows.length) return res.status(409).json({ error: 'Sähköposti on jo käytössä' });

      const hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role, organization_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [name, email, hash, role, organization_id || null]
      );
      const user  = result.rows[0];
      const token = signToken(user);
      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Palvelinvirhe' });
    }
  }
);

// GET /api/auth/me – Hae oma profiili
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.organization_id,
              o.name as organization_name, o.type as organization_type
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Käyttäjää ei löydy' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// PUT /api/auth/password – Vaihda salasana
router.put('/password', auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    try {
      const result = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
      const user   = result.rows[0];
      const match  = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Väärä nykyinen salasana' });

      const hash = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
      res.json({ message: 'Salasana vaihdettu' });
    } catch (err) {
      res.status(500).json({ error: 'Palvelinvirhe' });
    }
  }
);

module.exports = router;
