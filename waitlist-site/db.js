const mysql = require('mysql2/promise')

// Hostinger surfaces MySQL credentials as env vars. Fall back to the MYSQL_*
// spelling too, since hPanel and the API disagree on the prefix.
const config = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  // DATETIME(6) values come back as strings so we keep microsecond precision
  // instead of letting the JS Date constructor round it away — ordering and
  // waitlist position both depend on sub-second ties being broken correctly.
  dateStrings: true,
}

const pool = mysql.createPool(config)

// Created on boot rather than shipped as a migration step: the Hostinger JS
// deploy runs `npm install && npm start` with no hook for a separate migrate.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS waitlist_signup (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(120)  NOT NULL,
  email          VARCHAR(254)  NOT NULL,
  phone          VARCHAR(32)   NOT NULL DEFAULT '',
  audience       VARCHAR(32)   NOT NULL DEFAULT 'tenant',
  referral_code  VARCHAR(16)   NOT NULL,
  referred_by_id INT UNSIGNED  NULL,
  referral_count INT UNSIGNED  NOT NULL DEFAULT 0,
  source         VARCHAR(120)  NOT NULL DEFAULT '',
  user_agent     TEXT          NULL,
  created_at     DATETIME(6)   NOT NULL,
  updated_at     DATETIME(6)   NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_waitlist_email (email),
  UNIQUE KEY uniq_waitlist_referral_code (referral_code),
  KEY idx_waitlist_rank (referral_count DESC, created_at ASC),
  CONSTRAINT fk_waitlist_referred_by FOREIGN KEY (referred_by_id)
    REFERENCES waitlist_signup (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

async function init() {
  await pool.query(SCHEMA)
}

module.exports = { pool, init, config }
