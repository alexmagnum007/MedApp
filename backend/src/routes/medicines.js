const { Router } = require('express');
const db = require('../config/database');

const router = Router();

router.get('/', async (req, res) => {
  const { active } = req.query;
  let sql = 'SELECT * FROM medicines WHERE firebase_uid = ?';
  const params = [req.uid];
  if (active === 'true') { sql += ' AND active = 1'; }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows.map(formatMedicine));
});

router.post('/', async (req, res) => {
  const { name, dosage, frequency, startTime, startDate, endDate, prescriptionImageUrl, diseaseId, doctorId, notes } = req.body;
  if (!name || !dosage || !frequency || !startTime || !startDate) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, dosage, frequency, startTime, startDate' });
  }
  const [result] = await db.query(
    `INSERT INTO medicines
      (firebase_uid, name, dosage, frequency, start_time, start_date, end_date, prescription_image_url, disease_id, doctor_id, notes, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [req.uid, name, dosage, frequency, startTime, startDate, endDate || null, prescriptionImageUrl || null, diseaseId || null, doctorId || null, notes || null]
  );
  const [rows] = await db.query('SELECT * FROM medicines WHERE id = ?', [result.insertId]);
  res.status(201).json(formatMedicine(rows[0]));
});

router.delete('/:id', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM medicines WHERE id = ? AND firebase_uid = ?',
    [req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: 'Remédio não encontrado' });
  await db.query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

function formatMedicine(row) {
  return {
    id: String(row.id),
    userId: row.firebase_uid,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    startTime: row.start_time,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    prescriptionImageUrl: row.prescription_image_url || undefined,
    diseaseId: row.disease_id ? String(row.disease_id) : undefined,
    doctorId: row.doctor_id ? String(row.doctor_id) : undefined,
    notes: row.notes || undefined,
    active: Boolean(row.active),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

module.exports = router;
