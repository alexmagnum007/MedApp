const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'medapp_jwt_secret_2024';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);
    req.uid = String(decoded.userId);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;
