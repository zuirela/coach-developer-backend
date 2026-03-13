// middleware/auth.js – JWT-tarkistus
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kirjautuminen vaaditaan' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, organization_id }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Virheellinen tai vanhentunut token' });
  }
};

// Roolintarkistus – käytä auth-middlewaren jälkeen
module.exports.requireRole = function(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Ei oikeuksia tähän toimintoon' });
    }
    next();
  };
};
