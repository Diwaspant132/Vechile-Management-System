import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query("ALTER TABLE requests ADD COLUMN gate_status TEXT DEFAULT 'WAITING'");
    console.log("Column added");
  } catch(e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
}
run();
