import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function run() {
  const db = await open({ filename: './ntc_fleet.db', driver: sqlite3.Database });
  const rows = await db.all("PRAGMA table_info(drivers)");
  console.log(rows);
}
run();
