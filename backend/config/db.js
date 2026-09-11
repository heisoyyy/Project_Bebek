const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'duck_farm_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      dateStrings: true
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
    // Initial connection without database to create DB if not exists
    const initConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await initConn.query(schemaSql);
    console.log('✅ MySQL Database Schema initialized successfully.');

    const seedSql = fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8');
    await initConn.query(seedSql);
    console.log('✅ MySQL Seed Data initialized successfully.');

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
