CREATE DATABASE IF NOT EXISTS medapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medapp;

CREATE TABLE IF NOT EXISTS doctors (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  specialty   VARCHAR(255) NOT NULL,
  hospital    VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doctors_uid (firebase_uid)
);

CREATE TABLE IF NOT EXISTS diseases (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  symptoms     JSON,
  diagnosed_at VARCHAR(50) NOT NULL,
  doctor_id    INT,
  notes        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_diseases_uid (firebase_uid),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS disease_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  disease_id INT NOT NULL,
  image_url  TEXT NOT NULL,
  FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicines (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid          VARCHAR(128) NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  dosage                VARCHAR(255) NOT NULL,
  frequency             INT NOT NULL,
  start_time            VARCHAR(50) NOT NULL,
  start_date            VARCHAR(20) NOT NULL,
  end_date              VARCHAR(50),
  prescription_image_url TEXT,
  disease_id            INT,
  doctor_id             INT,
  notes                 TEXT,
  active                TINYINT(1) NOT NULL DEFAULT 1,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_medicines_uid (firebase_uid),
  FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL,
  doctor_id    INT NOT NULL,
  date         VARCHAR(50) NOT NULL,
  notes        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appointments_uid (firebase_uid),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointment_medicines (
  appointment_id INT NOT NULL,
  medicine_id    INT NOT NULL,
  PRIMARY KEY (appointment_id, medicine_id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id)    REFERENCES medicines(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL,
  name         VARCHAR(255) NOT NULL,
  date         VARCHAR(50) NOT NULL,
  doctor_id    INT,
  notes        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_exams_uid (firebase_uid),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exam_images (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  exam_id  INT NOT NULL,
  image_url TEXT NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);
