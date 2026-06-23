import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  get: (q, p) => pool.query(q, p).then(r => r.rows[0]),
  all: (q, p) => pool.query(q, p).then(r => r.rows),
  run: (q, p) => pool.query(q, p)
};

async function testCron() {
  console.log("Running Manual Automated Analytics CRON Job Test...");
  const metrics = await db.get(`
    SELECT 
      COUNT(id) as total_trips, 
      SUM(petrol_consumed) as total_fuel, 
      SUM(distance_km) as total_dist 
    FROM trip_history 
    WHERE DATE(end_time) = CURRENT_DATE AND status = 'COMPLETED'
  `);
  
  const today = new Date().toISOString().split('T')[0];
  const totalTrips = metrics?.total_trips || 0;
  const totalFuel = metrics?.total_fuel || 0;
  const totalDist = metrics?.total_dist || 0;

  console.log("Metrics:", { today, totalTrips, totalFuel, totalDist });

  await db.run(`
    INSERT INTO automated_reports (report_date, total_trips, total_fuel_consumed, total_distance)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (report_date) DO UPDATE SET
    total_trips = EXCLUDED.total_trips,
    total_fuel_consumed = EXCLUDED.total_fuel_consumed,
    total_distance = EXCLUDED.total_distance
  `, [today, totalTrips, totalFuel, totalDist]);

  console.log("Saved to automated_reports!");
  process.exit(0);
}

testCron().catch(console.error);
