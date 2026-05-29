const { Router } = require('express');
const db = require('../config/database');

const router = Router();

router.get('/', async (req, res) => {
  const { doctorId } = req.query;
  let sql = 'SELECT * FROM exams WHERE firebase_uid = ?';
  const params = [req.uid];
  if (doctorId) { sql += ' AND doctor_id = ?'; params.push(doctorId); }
  sql += ' ORDER BY date DESC';
  const [rows] = await db.query(sql, params);
  const exams = await Promise.all(rows.map(async (row) => {
    const [imgs] = await db.query('SELECT image_url FROM exam_images WHERE exam_id = ?', [row.id]);
    return formatExam(row, imgs.map((i) => i.image_url));
  }));
  res.json(exams);
});

router.post('/', async (req, res) => {
  const { name, date, doctorId, imageUrls, notes } = req.body;
  if (!name || !date) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, date' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO exams (firebase_uid, name, date, doctor_id, notes) VALUES (?, ?, ?, ?, ?)',
      [req.uid, name, date, doctorId || null, notes || null]
    );
    const examId = result.insertId;
    if (imageUrls?.length) {
      const values = imageUrls.map((url) => [examId, url]);
      await conn.query('INSERT INTO exam_images (exam_id, image_url) VALUES ?', [values]);
    }
    await conn.commit();
    const [rows] = await db.query('SELECT * FROM exams WHERE id = ?', [examId]);
    res.status(201).json(formatExam(rows[0], imageUrls || []));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM exams WHERE id = ? AND firebase_uid = ?',
    [req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: 'Exame não encontrado' });
  await db.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

function formatExam(row, imageUrls = []) {
  return {
    id: String(row.id),
    userId: row.firebase_uid,
    name: row.name,
    date: row.date,
    doctorId: row.doctor_id ? String(row.doctor_id) : undefined,
    imageUrls: imageUrls.length ? imageUrls : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

module.exports = router;
