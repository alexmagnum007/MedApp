const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = Router();
const SECRET = process.env.JWT_SECRET || 'medapp_jwt_secret_2024';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, email, password' });
  }
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.status(409).json({ error: 'Email já cadastrado' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hash]
  );
  const token = jwt.sign({ userId: result.insertId }, SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: { id: result.insertId, name, email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios: email, password' });
  }
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
