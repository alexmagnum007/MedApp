require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

async function initDb() {
  const dbName = process.env.DB_NAME || 'medapp';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  const db = require('./config/database');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firebase_uid VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      specialty VARCHAR(100) NOT NULL,
      hospital VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firebase_uid VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      dosage VARCHAR(50) NOT NULL,
      frequency INT NOT NULL,
      start_time VARCHAR(30) NOT NULL,
      start_date VARCHAR(30) NOT NULL,
      end_date VARCHAR(30),
      prescription_image_url TEXT,
      disease_id INT,
      doctor_id INT,
      notes TEXT,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS diseases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firebase_uid VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      symptoms TEXT,
      diagnosed_at VARCHAR(30),
      doctor_id INT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS disease_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      disease_id INT NOT NULL,
      image_url TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firebase_uid VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      date VARCHAR(30),
      doctor_id INT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS exam_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      exam_id INT NOT NULL,
      image_url TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firebase_uid VARCHAR(100) NOT NULL,
      doctor_id INT NOT NULL,
      date VARCHAR(50) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS appointment_medicines (
      appointment_id INT NOT NULL,
      medicine_id INT NOT NULL,
      PRIMARY KEY (appointment_id, medicine_id)
    )
  `);
}

app.use('/auth', require('./routes/auth'));
app.use('/upload', auth, require('./routes/upload'));
app.use('/medicines',    auth, require('./routes/medicines'));
app.use('/diseases',     auth, require('./routes/diseases'));
app.use('/doctors',      auth, require('./routes/doctors'));
app.use('/appointments', auth, require('./routes/appointments'));
app.use('/exams',        auth, require('./routes/exams'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erro interno' });
});

process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => app.listen(PORT, () => console.log(`MedApp API rodando em http://localhost:${PORT}`)))
  .catch(err => { console.error('Erro ao iniciar DB:', err); process.exit(1); });
