const { Router } = require('express');
const db = require('../config/database');

const router = Router();

router.get('/', async (req, res) => {
  const { upcoming } = req.query;
  let sql = 'SELECT * FROM appointments WHERE firebase_uid = ?';
  const params = [req.uid];
  if (upcoming === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    sql += ' AND date >= ?';
    params.push(today);
  }
  sql += ' ORDER BY date ASC';
  const [rows] = await db.query(sql, params);
  const appointments = await Promise.all(rows.map(async (row) => {
    const [meds] = await db.query(
      'SELECT medicine_id FROM appointment_medicines WHERE appointment_id = ?',
      [row.id]
    );
    return formatAppointment(row, meds.map((m) => String(m.medicine_id)));
  }));
  res.json(appointments);
});

router.post('/', async (req, res) => {
  const { doctorId, date, notes, prescriptionIds } = req.body;
  if (!doctorId || !date) {
    return res.status(400).json({ error: 'Campos obrigatórios: doctorId, date' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO appointments (firebase_uid, doctor_id, date, notes) VALUES (?, ?, ?, ?)',
      [req.uid, doctorId, date, notes || null]
    );
    const apptId = result.insertId;
    if (prescriptionIds?.length) {
      const values = prescriptionIds.map((mid) => [apptId, mid]);
      await conn.query('INSERT INTO appointment_medicines (appointment_id, medicine_id) VALUES ?', [values]);
    }
    await conn.commit();
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [apptId]);
    res.status(201).json(formatAppointment(rows[0], prescriptionIds || []));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

function formatAppointment(row, prescriptionIds = []) {
  return {
    id: String(row.id),
    userId: row.firebase_uid,
    doctorId: String(row.doctor_id),
    date: row.date,
    notes: row.notes || undefined,
    prescriptionIds,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

module.exports = router;
