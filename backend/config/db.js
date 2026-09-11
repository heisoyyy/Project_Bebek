const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

let pool;

// Gunakan SSL jika DB_SSL=true (untuk TiDB Cloud / cloud MySQL)
const sslConfig = process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'duck_farm_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      multipleStatements: true,
      dateStrings: true,
      ssl: sslConfig
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const connection = getPool();
  const [results] = await connection.execute(sql, params);
  return results;
}

async function initDatabase() {
  try {
    // Inisialisasi schema saja (CREATE TABLE IF NOT EXISTS - aman dijalankan berkali-kali)
    const initConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'duck_farm_db',
      multipleStatements: true,
      ssl: sslConfig
    });

    const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await initConn.query(schemaSql);
    console.log('✅ Database Schema initialized successfully.');

    await initConn.end();
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  }
}

module.exports = {
  getPool,
  query,
  initDatabase
};
