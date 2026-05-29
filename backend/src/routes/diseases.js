const { Router } = require('express');
const db = require('../config/database');

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM diseases WHERE firebase_uid = ? ORDER BY diagnosed_at DESC',
    [req.uid]
  );
  const diseases = await Promise.all(rows.map(async (row) => {
    const [imgs] = await db.query('SELECT image_url FROM disease_images WHERE disease_id = ?', [row.id]);
    return formatDisease(row, imgs.map((i) => i.image_url));
  }));
  res.json(diseases);
});

router.post('/', async (req, res) => {
  const { name, symptoms, diagnosedAt, doctorId, imageUrls, notes } = req.body;
  if (!name || !diagnosedAt) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, diagnosedAt' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO diseases (firebase_uid, name, symptoms, diagnosed_at, doctor_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.uid, name, JSON.stringify(symptoms || []), diagnosedAt, doctorId || null, notes || null]
    );
    const diseaseId = result.insertId;
    if (imageUrls?.length) {
      const values = imageUrls.map((url) => [diseaseId, url]);
      await conn.query('INSERT INTO disease_images (disease_id, image_url) VALUES ?', [values]);
    }
    await conn.commit();
    const [rows] = await db.query('SELECT * FROM diseases WHERE id = ?', [diseaseId]);
    res.status(201).json(formatDisease(rows[0], imageUrls || []));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM diseases WHERE id = ? AND firebase_uid = ?',
    [req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: 'Doença não encontrada' });
  await db.query('DELETE FROM diseases WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

function formatDisease(row, imageUrls = []) {
  let symptoms = [];
  try { symptoms = typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : (row.symptoms || []); } catch {}
  return {
    id: String(row.id),
    userId: row.firebase_uid,
    name: row.name,
    symptoms,
    diagnosedAt: row.diagnosed_at,
    doctorId: row.doctor_id ? String(row.doctor_id) : undefined,
    imageUrls: imageUrls.length ? imageUrls : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

module.exports = router;
