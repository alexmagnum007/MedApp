const { Router } = require('express');
const db = require('../config/database');

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM doctors WHERE firebase_uid = ? ORDER BY name',
    [req.uid]
  );
  res.json(rows.map(formatDoctor));
});

router.post('/', async (req, res) => {
  const { name, specialty, hospital, phone } = req.body;
  if (!name || !specialty || !hospital) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, specialty, hospital' });
  }
  const [result] = await db.query(
    'INSERT INTO doctors (firebase_uid, name, specialty, hospital, phone) VALUES (?, ?, ?, ?, ?)',
    [req.uid, name, specialty, hospital, phone || null]
  );
  const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [result.insertId]);
  res.status(201).json(formatDoctor(rows[0]));
});

router.delete('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM doctors WHERE id = ? AND firebase_uid = ?',
    [req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: 'Médico não encontrado' });
  await db.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

function formatDoctor(row) {
  return {
    id: String(row.id),
    userId: row.firebase_uid,
    name: row.name,
    specialty: row.specialty,
    hospital: row.hospital,
    phone: row.phone || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

module.exports = router;
