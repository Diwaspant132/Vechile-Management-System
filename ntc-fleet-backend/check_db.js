import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function run() {
  const db = await open({ filename: './ntc_fleet.db', driver: sqlite3.Database });
  const assignments = await db.all("SELECT * FROM driver_vehicle_assignments");
  console.log("ASSIGNMENTS:", assignments);
  const vehicles = await db.all("SELECT * FROM vehicles");
  console.log("VEHICLES:", vehicles);
  const drivers = await db.all("SELECT * FROM drivers");
  console.log("DRIVERS:", drivers);
}
run();
