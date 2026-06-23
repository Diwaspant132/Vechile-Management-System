import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT,
      phone_number TEXT,
      branch TEXT,
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      license_number TEXT UNIQUE,
      phone_number TEXT,
      status TEXT DEFAULT 'AVAILABLE',
      current_branch TEXT,
      registration_status TEXT DEFAULT 'PENDING',
      trip_active INTEGER DEFAULT 0,
      license_document_url TEXT,
      default_vehicle_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      license_plate TEXT UNIQUE,
      model TEXT,
      fuel_level INTEGER DEFAULT 100,
      branch TEXT,
      status TEXT DEFAULT 'AVAILABLE',
      total_distance REAL DEFAULT 0,
      mileage_kmpl REAL DEFAULT 15.0,
      bluebook_document_url TEXT
    );
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
      vehicle_type TEXT,
      purpose TEXT,
      pickup_location TEXT,
      destination TEXT,
      pickup_time TEXT,
      status TEXT,
      passengers TEXT
    );
    CREATE TABLE IF NOT EXISTS vehicle_locations (
        vehicle_id INTEGER PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
        latitude REAL,
        longitude REAL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trip_history (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
      vehicle_id INTEGER,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      status TEXT,
      distance_km REAL DEFAULT 0,
      petrol_consumed REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      type TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      require_manager_approval INTEGER DEFAULT 1,
      auto_assign_drivers INTEGER DEFAULT 0,
      maintenance_alerts INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_notif INTEGER DEFAULT 1,
      sms_notif INTEGER DEFAULT 0,
      push_notif INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS fuel_logs (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      liters_added REAL,
      cost REAL,
      token_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      reported_by_driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      service_type TEXT,
      description TEXT,
      cost REAL,
      status TEXT DEFAULT 'PENDING',
      scheduled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_date TIMESTAMP,
      mechanic_notes TEXT
    );
    CREATE TABLE IF NOT EXISTS vehicle_transfers (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      from_branch TEXT,
      to_branch TEXT,
      status TEXT DEFAULT 'PENDING',
      requested_by_admin_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );
    INSERT INTO system_settings (require_manager_approval) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM system_settings);
  `);
  console.log("DB setup complete");
  process.exit(0);
}
initDB().catch(console.error);
