import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PG_URI = process.argv[2];
if (!PG_URI) {
    console.error("Please provide the PostgreSQL connection string as an argument.");
    process.exit(1);
}

const pool = new Pool({
  connectionString: PG_URI,
  ssl: { rejectUnauthorized: false }
});

const TABLES = [
  'users',
  'drivers',
  'vehicles',
  'requests',
  'vehicle_locations',
  'trip_history',
  'notifications',
  'audit_logs',
  'system_settings',
  'user_settings',
  'fuel_logs',
  'maintenance_logs',
  'vehicle_transfers'
];

async function migrate() {
  const sqliteDb = await open({
    filename: path.join(__dirname, 'ntc_vms.db'),
    driver: sqlite3.Database
  });

  console.log("Connected to SQLite and PostgreSQL");

  for (const table of TABLES) {
    console.log(`Migrating table: ${table}...`);
    try {
        const rows = await sqliteDb.all(`SELECT * FROM ${table}`);
        if (rows.length === 0) {
            console.log(`  Skipping ${table}: No data.`);
            continue;
        }

        const columns = Object.keys(rows[0]);
        const colsStr = columns.join(', ');

        for (const row of rows) {
            const values = columns.map(col => row[col]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            
            await pool.query(
                `INSERT INTO ${table} (${colsStr}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
            );
        }
        
        // Reset the sequence if there is an id column
        if (columns.includes('id')) {
           const seqRes = await pool.query(`SELECT pg_get_serial_sequence('${table}', 'id') as seq`);
           if (seqRes.rows[0] && seqRes.rows[0].seq) {
               await pool.query(`SELECT setval('${seqRes.rows[0].seq}', COALESCE((SELECT MAX(id)+1 FROM ${table}), 1), false)`);
           }
        }
        
        console.log(`  Migrated ${rows.length} rows to ${table}.`);
    } catch (err) {
        console.error(`  Error migrating ${table}:`, err.message);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
    console.error("Global Migration Error:", err);
    process.exit(1);
});
