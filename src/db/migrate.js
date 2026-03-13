// migrate.js – Ajaa schema.sql tietokantaan
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('./index');

async function migrate() {
  console.log('⏳ Ajetaan migraatio...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await db.query(sql);
    console.log('✅ Migraatio valmis!');
  } catch (err) {
    console.error('❌ Migraatiovirhe:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

migrate();
