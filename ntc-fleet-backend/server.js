import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { verifyToken, requireRole } from './middleware/auth.js';

dotenv.config();

// FORCE NODE TO UTC SO POSTGRES TIMESTAMPS ARE NOT DOUBLE-SHIFTED
process.env.TZ = 'UTC';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'NTC_SUPER_SECRET_KEY_9841';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// SECURITY HARDENING MIDDLEWARES
// ---------------------------------------------------------
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow image loading for uploads

// Global API Rate Limiter (Prevent DoS)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per `window`
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

// Strict Authentication Rate Limiter (Prevent Brute Force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts
  message: { error: 'Too many login attempts, please try again after 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

// ---------------------------------------------------------
// GLOBAL JWT AUTHORIZATION & RBAC
// ---------------------------------------------------------
// Exclude public auth routes from JWT checks
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  if (req.path.startsWith('/tracking/all')) return next(); // Ensure public tracking map doesn't crash if unauth (or require token if private)
  return verifyToken(req, res, next);
});

// Enforce Role-Based Access Control (RBAC) on Admin Endpoints
app.use('/api/admin', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/settings/system', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/settings/geofence', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/vehicles/transfers', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/users/approve', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/users/reject', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));
app.use('/api/users/remove', requireRole(['SUPER_ADMIN', 'BRANCH_ADMIN']));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'license-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  run: async (query, params = []) => {
    let index = 1;
    let pgQuery = query.replace(/\?/g, () => `$${index++}`);
    if (pgQuery.trim().toUpperCase().startsWith('INSERT') && !pgQuery.toUpperCase().includes('RETURNING')) {
        pgQuery += ' RETURNING id';
    }
    const res = await pool.query(pgQuery, params);
    return { lastID: res.rows.length > 0 ? res.rows[0].id : null, changes: res.rowCount };
  },
  get: async (query, params = []) => {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgQuery, params);
    return res.rows[0];
  },
  all: async (query, params = []) => {
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    const res = await pool.query(pgQuery, params);
    return res.rows;
  },
  exec: async (query) => {
    await pool.query(query);
  }
};

async function initDB() {
  await db.exec(`
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
      passengers TEXT,
      gate_status TEXT DEFAULT 'WAITING',
      gate_departed_at TIMESTAMP,
      gate_returned_at TIMESTAMP
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
    CREATE TABLE IF NOT EXISTS branch_settings (
      branch TEXT PRIMARY KEY,
      geofence_lat REAL,
      geofence_lng REAL,
      geofence_radius_km REAL DEFAULT 20.0
    );
    CREATE TABLE IF NOT EXISTS automated_reports (
      id SERIAL PRIMARY KEY,
      report_date DATE UNIQUE,
      total_trips INTEGER DEFAULT 0,
      total_fuel_consumed REAL DEFAULT 0,
      total_distance REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO system_settings (require_manager_approval) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM system_settings);
  `);
  
  try {
    await db.exec("ALTER TABLE requests ADD COLUMN gate_departed_at TIMESTAMP;");
  } catch(e) {}
  try {
    await db.exec("ALTER TABLE requests ADD COLUMN gate_returned_at TIMESTAMP;");
  } catch(e) {}

  console.log("✅ Database initialized with Trip Activation and Live Tracking support (PostgreSQL).");
}

async function logAudit(type, description) {
  try {
    await db.run("INSERT INTO audit_logs (type, description) VALUES (?, ?)", [type, description]);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role, requested_role, phone_number, branch } = req.body;
    const finalRole = role || requested_role || 'EMPLOYEE';
    const initialStatus = ['EMPLOYEE', 'SECURITY'].includes(finalRole) ? 'APPROVED' : 'PENDING';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.run('BEGIN TRANSACTION');
    await db.run(`INSERT INTO users (username, email, password, first_name, last_name, role, phone_number, branch, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      [username, email, hashedPassword, first_name, last_name, finalRole, phone_number, branch, initialStatus]);
    
    if (finalRole === 'DRIVER') {
      await db.run(`INSERT INTO drivers (first_name, last_name, phone_number, current_branch, status, registration_status, trip_active) VALUES (?, ?, ?, ?, 'AVAILABLE', 'PENDING', 0)`, 
        [first_name, last_name, phone_number, branch]);
    }
    
    await db.run('COMMIT');
    await logAudit('SECURITY', `New user registered: ${username} (${finalRole})`);
    
    // Notify all Super Admins that a new user needs approval
    if (initialStatus === 'PENDING') {
      const superAdmins = await db.all("SELECT id FROM users WHERE role = 'SUPER_ADMIN'");
      for (const admin of superAdmins) {
        await pushNotification(admin.id, 'warning', `New ${finalRole.replace('_', ' ')} registration pending approval: ${first_name} ${last_name}`);
      }
    }
    
    res.status(201).json({ message: "Registration successful!" });
  } catch (error) { 
    await db.run('ROLLBACK');
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    await logAudit('SECURITY', `Failed authentication attempt for username: ${username}.`);
    return res.status(401).json({ error: "Invalid credentials." });
  }
  
  if (user.status === 'REJECTED') {
    await logAudit('SECURITY', `Rejected user attempted login: ${username}.`);
    return res.status(403).json({ error: "Your access has been revoked. Please contact administration." });
  }
  
  if (user.status === 'PENDING') {
    await logAudit('SECURITY', `Pending user attempted login: ${username}.`);
    return res.status(403).json({ error: "Your account is pending approval." });
  }

  const token = jwt.sign({ userId: user.id, role: user.role, branch: user.branch }, JWT_SECRET, { expiresIn: '24h' });
  await logAudit('SECURITY', `User ${username} successfully authenticated session.`);
  res.json({ token, user });
});

app.get('/api/admin/pending-admins', async (req, res) => {
  try {
    const pending = await db.all("SELECT * FROM users WHERE status = 'PENDING' AND role = 'BRANCH_ADMIN'");
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending admins." });
  }
});

app.put('/api/users/approve/:id', async (req, res) => {
  try {
    await db.run("UPDATE users SET status = 'APPROVED' WHERE id = ?", [req.params.id]);
    await logAudit('APPROVAL', `Admin activated user ID ${req.params.id}.`);
    res.json({ message: "Admin activated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status." });
  }
});

app.get('/api/admin/history-admins', async (req, res) => {
  try {
    const history = await db.all("SELECT * FROM users WHERE status IN ('APPROVED', 'REJECTED') AND role = 'BRANCH_ADMIN' ORDER BY id DESC");
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin history." });
  }
});

app.put('/api/users/reject/:id', async (req, res) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found." });

    await db.run("UPDATE users SET status = 'REJECTED' WHERE id = ?", [req.params.id]);
    
    // Also mark driver profile as rejected if applicable
    if (user.role === 'DRIVER') {
      await db.run("UPDATE drivers SET status = 'REJECTED', registration_status = 'REJECTED' WHERE phone_number = ? AND first_name = ?", [user.phone_number, user.first_name]);
    }
    
    await logAudit('SECURITY', `Registration request rejected for user ID ${req.params.id}.`);
    res.json({ message: "Registration request rejected successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject user request." });
  }
});

app.delete('/api/users/remove/:id', async (req, res) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found." });

    await db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
    
    // Cleanup pending driver profile if this was a driver registration
    if (user.role === 'DRIVER') {
      await db.run("DELETE FROM drivers WHERE phone_number = ? AND first_name = ?", [user.phone_number, user.first_name]);
    }
    
    await logAudit('SECURITY', `Registration request rejected and removed for user ID ${req.params.id}.`);
    res.json({ message: "Registration request removed successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove user request." });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = "SELECT id, username, email, first_name, last_name, phone_number, branch, status FROM users WHERE role = 'EMPLOYEE'";
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " AND branch = ?";
      params.push(branch);
    }
    query += " ORDER BY id DESC";
    const employees = await db.all(query, params);
    res.json(employees);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/employees/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.run("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id]);
    await logAudit('MUTATION', `Employee ID ${req.params.id} status updated to ${status}.`);
    res.json({ message: "Employee status updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/security', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = "SELECT id, username, email, first_name, last_name, phone_number, branch, status FROM users WHERE role = 'SECURITY'";
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " AND branch = ?";
      params.push(branch);
    }
    query += " ORDER BY id DESC";
    const securityGuards = await db.all(query, params);
    res.json(securityGuards);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/security/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.run("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id]);
    await logAudit('MUTATION', `Security ID ${req.params.id} status updated to ${status}.`);
    res.json({ message: "Security guard status updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = `
      SELECT d.*, v.license_plate as default_vehicle_plate, v.model as default_vehicle_model
      FROM drivers d
      LEFT JOIN vehicles v ON d.default_vehicle_id = v.id
    `;
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " WHERE d.current_branch = ?";
      params.push(branch);
    }
    const drivers = await db.all(query, params);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/drivers/:id/default-vehicle', async (req, res) => {
  try {
    const vehicleId = req.body.vehicle_id || null;
    await db.run("UPDATE drivers SET default_vehicle_id = ? WHERE id = ?", [vehicleId, req.params.id]);
    res.json({ message: "Default vehicle assigned successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trip Activation Route
app.put('/api/drivers/trip-status', async (req, res) => {
  try {
    const { driver_id, trip_active, distance_km, petrol_consumed } = req.body;
    await db.run("BEGIN TRANSACTION");
    
    await db.run(
      "UPDATE drivers SET trip_active = ? WHERE id = ?", 
      [trip_active, driver_id]
    );
    
    // Find active request to sync vehicle and request status
    const request = await db.get(`
      SELECT id, vehicle_id FROM requests 
      WHERE driver_id = ? AND status IN ('APPROVED', 'IN_PROGRESS') 
      ORDER BY id ASC LIMIT 1
    `, [driver_id]);
    
    if (trip_active) {
      // Start a new trip
      await db.run("UPDATE drivers SET status = 'ON TRIP' WHERE id = ?", [driver_id]);
      let v_id = null;
      if (request) {
        if (request.vehicle_id) {
          await db.run("UPDATE vehicles SET status = 'ON TRIP' WHERE id = ?", [request.vehicle_id]);
          v_id = request.vehicle_id;
        }
        await db.run("UPDATE requests SET status = 'IN_PROGRESS' WHERE id = ?", [request.id]);
      }
      await db.run(
        "INSERT INTO trip_history (driver_id, vehicle_id, status) VALUES (?, ?, 'ACTIVE')",
        [driver_id, v_id]
      );
    } else {
      // End the active trip
      await db.run("UPDATE drivers SET status = 'AVAILABLE' WHERE id = ?", [driver_id]);
      if (request) {
        if (request.vehicle_id) {
          await db.run("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?", [request.vehicle_id]);
        }
        await db.run("UPDATE requests SET status = 'COMPLETED' WHERE id = ?", [request.id]);
      }
      
      const activeTrip = await db.get("SELECT id FROM trip_history WHERE driver_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1", [driver_id]);
      if (activeTrip) {
        await db.run(
          "UPDATE trip_history SET status = 'COMPLETED', end_time = CURRENT_TIMESTAMP, distance_km = ?, petrol_consumed = ? WHERE id = ?",
          [distance_km || 0, petrol_consumed || 0, activeTrip.id]
        );
      }
      
      if (request && request.vehicle_id && distance_km) {
        const vOld = await db.get("SELECT total_distance, branch, license_plate FROM vehicles WHERE id = ?", [request.vehicle_id]);
        const oldDistance = vOld ? (vOld.total_distance || 0) : 0;
        
        await db.run("UPDATE vehicles SET total_distance = COALESCE(total_distance, 0) + ? WHERE id = ?", [distance_km, request.vehicle_id]);
        
        const newDistance = oldDistance + distance_km;
        if (Math.floor(newDistance / 1000) > Math.floor(oldDistance / 1000)) {
           const milestone = Math.floor(newDistance / 1000) * 1000;
           if (vOld && vOld.branch) {
              const admins = await db.all("SELECT id FROM users WHERE role = 'BRANCH_ADMIN' AND branch = ?", [vOld.branch]);
              for (let a of admins) {
                 await pushNotification(a.id, 'warning', `Routine check Required for Vehicle ${vOld.license_plate} (${milestone}km milestone).`);
              }
           }
           await db.run(
             `INSERT INTO maintenance_logs (vehicle_id, reported_by_driver_id, service_type, description, status) VALUES (?, NULL, 'Routine Check', ?, 'PENDING')`, 
             [request.vehicle_id, `Automated alert: Vehicle crossed the ${milestone}km milestone.`]
           );
           await logAudit('SYSTEM', `Automated routine maintenance scheduled for Vehicle ID ${request.vehicle_id} at ${milestone}km.`);
        }
      }
    }
    
    await db.run("COMMIT");
    await logAudit('MUTATION', `Trip status updated for driver ID ${driver_id} (Active: ${trip_active}).`);
    res.json({ message: "Trip status updated successfully" });
  } catch (e) { 
    await db.run("ROLLBACK");
    res.status(500).json({ error: e.message }); 
  }
});

app.get('/api/drivers/:id/trips', async (req, res) => {
  try {
    const trips = await db.all(`
      SELECT t.*, v.license_plate, v.model as vehicle_model
      FROM trip_history t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.driver_id = ?
      ORDER BY t.id DESC
    `, [req.params.id]);
    res.json(trips);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/drivers/:id/status', async (req, res) => {
  try {
    const { registration_status } = req.body;
    const driverId = req.params.id;
    
    await db.run("BEGIN TRANSACTION");
    
    await db.run("UPDATE drivers SET registration_status = ? WHERE id = ?", [registration_status, driverId]);
    
    // Also update the user account status
    // Drivers are linked to Users via phone_number
    const driver = await db.get("SELECT phone_number FROM drivers WHERE id = ?", [driverId]);
    if (driver && driver.phone_number) {
        await db.run("UPDATE users SET status = ? WHERE phone_number = ? AND role = 'DRIVER'", [registration_status, driver.phone_number]);
    }
    
    await db.run("COMMIT");
    res.json({ message: "Status updated" });
  } catch (e) { 
    await db.run("ROLLBACK");
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/drivers/:id/document', upload.single('license_document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Create the URL to access the file
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    await db.run("UPDATE drivers SET license_document_url = ? WHERE id = ?", [fileUrl, req.params.id]);
    res.json({ message: "Document uploaded successfully", url: fileUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Vehicle Management Routes
app.get('/api/vehicles', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = "SELECT * FROM vehicles";
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " WHERE branch = ?";
      params.push(branch);
    }
    query += " ORDER BY id DESC";
    const vehicles = await db.all(query, params);
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/driver/my-vehicle/:id', async (req, res) => {
  try {
    let vehicle = await db.get(`
      SELECT v.* FROM requests r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.driver_id = ? AND r.status IN ('APPROVED', 'IN_PROGRESS')
      ORDER BY r.id ASC LIMIT 1
    `, [req.params.id]);
    
    if (!vehicle) {
      // Fallback to default vehicle
      vehicle = await db.get(`
        SELECT v.* FROM drivers d
        JOIN vehicles v ON d.default_vehicle_id = v.id
        WHERE d.id = ?
      `, [req.params.id]);
    }
    
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: "No vehicle assigned currently" });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const { license_plate, model, branch, mileage_kmpl, initial_distance } = req.body;
    if (!license_plate || !branch) return res.status(400).json({ error: "License plate and branch are required" });
    
    const mileage = parseFloat(mileage_kmpl) || 15.0;
    const distance = parseFloat(initial_distance) || 0;
    
    const result = await db.run(
      `INSERT INTO vehicles (license_plate, model, branch, status, total_distance, mileage_kmpl) VALUES (?, ?, ?, 'AVAILABLE', ?, ?)`, 
      [license_plate, model, branch, distance, mileage]
    );
    await logAudit('MUTATION', `New vehicle registered: ${license_plate} (${model}) for branch ${branch} with initial distance ${distance}km.`);
    res.status(200).json({ message: "Vehicle registered successfully!", vehicleId: result.lastID });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/vehicles/:id/bluebook', upload.single('bluebook_document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Create the URL to access the file
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    await db.run("UPDATE vehicles SET bluebook_document_url = ? WHERE id = ?", [fileUrl, req.params.id]);
    res.json({ message: "Bluebook uploaded successfully", url: fileUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/vehicles/:id/reports', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const trips = await db.all(`
      SELECT t.*, d.first_name, d.last_name 
      FROM trip_history t
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.vehicle_id = ? AND t.status = 'COMPLETED'
      ORDER BY t.end_time DESC
    `, [vehicleId]);
    
    const fuel_logs = await db.all(`
      SELECT f.*, d.first_name, d.last_name
      FROM fuel_logs f
      LEFT JOIN drivers d ON f.driver_id = d.id
      WHERE f.vehicle_id = ?
      ORDER BY f.created_at DESC
    `, [vehicleId]);
    
    const maintenance_logs = await db.all(`
      SELECT m.*, d.first_name, d.last_name
      FROM maintenance_logs m
      LEFT JOIN drivers d ON m.reported_by_driver_id = d.id
      WHERE m.vehicle_id = ?
      ORDER BY m.id DESC
    `, [vehicleId]);
    
    const vehicle = await db.get("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);
    
    res.json({ vehicle, trips, fuel_logs, maintenance_logs });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/vehicles/:id/fuel', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { driver_id, liters_added, token_date } = req.body;
    await db.run(
      "INSERT INTO fuel_logs (vehicle_id, driver_id, liters_added, token_date) VALUES (?, ?, ?, ?)",
      [vehicleId, driver_id, liters_added, token_date || new Date().toISOString().split('T')[0]]
    );
    await logAudit('MUTATION', `Fuel token logged for Vehicle ID ${vehicleId} by Driver ID ${driver_id} (${liters_added}L).`);
    res.json({ message: "Fuel token logged successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles/:id/reset', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    await db.run("BEGIN TRANSACTION");
    await db.run("DELETE FROM trip_history WHERE vehicle_id = ?", [vehicleId]);
    await db.run("DELETE FROM fuel_logs WHERE vehicle_id = ?", [vehicleId]);
    await db.run("UPDATE vehicles SET total_distance = 0 WHERE id = ?", [vehicleId]);
    await db.run("COMMIT");
    await logAudit('MUTATION', `Vehicle ID ${vehicleId} history and distance reset by admin.`);
    res.json({ message: "Vehicle history reset successfully." });
  } catch (error) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

// Remove Vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    await db.run("DELETE FROM vehicles WHERE id = ?", [vehicleId]);
    await logAudit('MUTATION', `Vehicle ID ${vehicleId} permanently removed from system.`);
    res.json({ message: "Vehicle removed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer Request
app.post('/api/vehicles/:id/transfer', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { from_branch, requested_by_admin_id } = req.body;
    await db.run(
      "INSERT INTO vehicle_transfers (vehicle_id, from_branch, requested_by_admin_id) VALUES (?, ?, ?)",
      [vehicleId, from_branch, requested_by_admin_id]
    );
    await logAudit('MUTATION', `Vehicle transfer request initiated for Vehicle ID ${vehicleId} from ${from_branch}.`);
    res.json({ message: "Transfer request sent to Super Admin." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Pending Transfers
app.get('/api/vehicles/transfers', async (req, res) => {
  try {
    const transfers = await db.all(`
      SELECT t.*, v.license_plate, v.model, u.first_name, u.last_name 
      FROM vehicle_transfers t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.requested_by_admin_id = u.id
      WHERE t.status = 'PENDING'
      ORDER BY t.created_at DESC
    `);
    res.json(transfers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approve Transfer
app.post('/api/vehicles/transfers/:id/approve', async (req, res) => {
  try {
    const transferId = req.params.id;
    const { to_branch } = req.body;
    
    await db.run("BEGIN TRANSACTION");
    
    const transfer = await db.get("SELECT * FROM vehicle_transfers WHERE id = ?", [transferId]);
    if (!transfer) throw new Error("Transfer request not found");
    
    await db.run(
      "UPDATE vehicle_transfers SET status = 'APPROVED', to_branch = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
      [to_branch, transferId]
    );
    
    await db.run("UPDATE vehicles SET branch = ? WHERE id = ?", [to_branch, transfer.vehicle_id]);
    
    const receivingAdmins = await db.all("SELECT id FROM users WHERE role = 'BRANCH_ADMIN' AND branch = ?", [to_branch]);
    const vehicle = await db.get("SELECT license_plate FROM vehicles WHERE id = ?", [transfer.vehicle_id]);
    
    for (const admin of receivingAdmins) {
      await db.run(
        "INSERT INTO notifications (user_id, type, message) VALUES (?, 'VEHICLE_TRANSFER', ?)",
        [admin.id, `Vehicle ${vehicle.license_plate} has been transferred to your branch (${to_branch}).`]
      );
    }
    
    await db.run("COMMIT");
    await logAudit('MUTATION', `Vehicle transfer ${transferId} approved. Vehicle ${transfer.vehicle_id} moved to ${to_branch}.`);
    res.json({ message: "Vehicle transferred successfully." });
  } catch (e) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
});

// Maintenance API
app.get('/api/maintenance', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = `
      SELECT m.*, v.license_plate as plateNumber, v.model as vehicle_model, d.first_name, d.last_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      LEFT JOIN drivers d ON m.reported_by_driver_id = d.id
    `;
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " WHERE v.branch = ?";
      params.push(branch);
    }
    query += " ORDER BY m.id DESC";
    const logs = await db.all(query, params);
    res.json(logs);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const { vehicle_id, reported_by_driver_id, service_type, description, scheduled_date } = req.body;
    await db.run(
      `INSERT INTO maintenance_logs (vehicle_id, reported_by_driver_id, service_type, description, scheduled_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [vehicle_id, reported_by_driver_id || null, service_type, description, scheduled_date || new Date().toISOString()]
    );
    await logAudit('MUTATION', `Maintenance requested for Vehicle ID ${vehicle_id} (${service_type}).`);
    res.status(201).json({ message: "Maintenance request created" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/maintenance/:id/status', async (req, res) => {
  try {
    const { status, cost, mechanic_notes } = req.body;
    const logId = req.params.id;
    const log = await db.get("SELECT vehicle_id FROM maintenance_logs WHERE id = ?", [logId]);
    if (!log) return res.status(404).json({ error: "Log not found" });

    await db.run("BEGIN TRANSACTION");
    
    if (status === 'COMPLETED') {
      await db.run(
        "UPDATE maintenance_logs SET status = ?, cost = ?, mechanic_notes = ?, completed_date = CURRENT_TIMESTAMP WHERE id = ?",
        [status, cost || 0, mechanic_notes || '', logId]
      );
      await db.run("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?", [log.vehicle_id]);
      await logAudit('APPROVAL', `Maintenance #${logId} completed for Vehicle ID ${log.vehicle_id} (Cost: ${cost}).`);
    } else {
      await db.run("UPDATE maintenance_logs SET status = ? WHERE id = ?", [status, logId]);
      if (status === 'IN_PROGRESS') {
         await db.run("UPDATE vehicles SET status = 'UNDER MAINTENANCE' WHERE id = ?", [log.vehicle_id]);
         await logAudit('MUTATION', `Vehicle ID ${log.vehicle_id} marked as UNDER MAINTENANCE.`);
      }
    }
    
    await db.run("COMMIT");
    res.json({ message: "Maintenance status updated successfully" });
  } catch (error) { 
    await db.run("ROLLBACK");
    res.status(500).json({ error: error.message }); 
  }
});

// Live Tracking Routes
app.post('/api/tracking/update', async (req, res) => {
  const { vehicle_id, latitude, longitude } = req.body;
  try {
    await db.run(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, last_updated) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT (vehicle_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, last_updated = CURRENT_TIMESTAMP`,
      [vehicle_id, latitude, longitude]
    );
    res.json({ message: "Location updated" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tracking/all', async (req, res) => {
  try {
    const { branch } = req.query;
    let query = `
      SELECT v.id as vehicle_id, l.latitude, l.longitude, l.last_updated, v.license_plate, v.model, v.status, r.pickup_location, r.destination, v.branch
      FROM vehicles v
      LEFT JOIN vehicle_locations l ON l.vehicle_id = v.id
      LEFT JOIN requests r ON r.vehicle_id = v.id AND r.status IN ('APPROVED', 'IN_PROGRESS')
      WHERE (v.status = 'ON TRIP' OR v.status = 'IN_PROGRESS')
    `;
    const params = [];
    if (branch && branch !== 'ALL') {
      query += " AND v.branch = ?";
      params.push(branch);
    }
    const locations = await db.all(query, params);
    res.json(locations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/requests', async (req, res) => {
  const { branch } = req.query;
  let query = `
    SELECT r.*, u.first_name, u.last_name, u.branch as user_branch, v.license_plate, v.model as vehicle_model, d.first_name as driver_first_name, d.last_name as driver_last_name, d.phone_number as driver_phone
    FROM requests r 
    JOIN users u ON r.employee_id = u.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    LEFT JOIN drivers d ON r.driver_id = d.id
  `;
  const params = [];
  if (branch && branch !== 'ALL') {
    query += " WHERE u.branch = ?";
    params.push(branch);
  }
  query += " ORDER BY r.id DESC";
  res.json(await db.all(query, params));
});

app.get('/api/drivers/:id/current-request', async (req, res) => {
  try {
    const request = await db.get(`
      SELECT r.*, u.first_name, u.last_name, u.phone_number 
      FROM requests r 
      JOIN users u ON r.employee_id = u.id 
      WHERE r.driver_id = ? AND r.status IN ('APPROVED', 'IN_PROGRESS') 
      ORDER BY r.id ASC LIMIT 1
    `, [req.params.id]);
    res.json(request || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { employee_id, vehicle_type, purpose, pickup_location, destination, pickup_time, passengers } = req.body;
    
    const passengersStr = passengers && passengers.length > 0 ? JSON.stringify(passengers) : null;

    // Insert request
    const result = await db.run(`INSERT INTO requests (employee_id, vehicle_type, purpose, pickup_location, destination, pickup_time, status, passengers) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`, 
      [employee_id, vehicle_type, purpose, pickup_location, destination, pickup_time, passengersStr]);
      
    // Notify Branch Admin only (isolate notifications to the specific branch)
    const userRow = await db.get(`SELECT branch FROM users WHERE id = ?`, [employee_id]);
    if (userRow && userRow.branch) {
      const branchAdmins = await db.all(`SELECT id FROM users WHERE role = 'BRANCH_ADMIN' AND branch = ?`, [userRow.branch]);
      
      for (let admin of branchAdmins) {
        await pushNotification(admin.id, 'warning', `New vehicle request submitted for ${destination}.`);
      }
    }
    
    res.status(201).json({ message: 'Request submitted successfully!' });
  } catch (error) {
    res.status(500).json({ error: "Failed to log request in database." });
  }
});

app.put('/api/requests/status/:id', async (req, res) => {
  try {
    const status = (req.body.status || '').toUpperCase();
    const requestId = req.params.id;
    const requestData = await db.get("SELECT driver_id, vehicle_id FROM requests WHERE id = ?", [requestId]);
    await db.run("UPDATE requests SET status = ? WHERE id = ?", [status, requestId]);
    if ((status === 'COMPLETED' || status === 'CANCELLED') && requestData) {
      if (requestData.driver_id) await db.run("UPDATE drivers SET status = 'AVAILABLE' WHERE id = ?", [requestData.driver_id]);
      if (requestData.vehicle_id) await db.run("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?", [requestData.vehicle_id]);
    }
    
    // Notify users about cancellation
    if (status === 'CANCELLED') {
      const reqInfo = await db.get("SELECT employee_id, destination, driver_id FROM requests WHERE id = ?", [requestId]);
      if (reqInfo) {
        const userRow = await db.get("SELECT first_name, last_name, branch FROM users WHERE id = ?", [reqInfo.employee_id]);
        if (userRow && userRow.branch) {
          const branchAdmins = await db.all("SELECT id FROM users WHERE role = 'BRANCH_ADMIN' AND branch = ?", [userRow.branch]);
          for (let admin of branchAdmins) {
            await pushNotification(admin.id, 'warning', `Vehicle request for ${reqInfo.destination} by ${userRow.first_name} was cancelled.`);
          }
        }
        if (reqInfo.driver_id) {
          const driverInfo = await db.get("SELECT phone_number FROM drivers WHERE id = ?", [reqInfo.driver_id]);
          if (driverInfo) {
            const driverUser = await db.get("SELECT id FROM users WHERE phone_number = ? AND role = 'DRIVER'", [driverInfo.phone_number]);
            if (driverUser) {
              await pushNotification(driverUser.id, 'warning', `Your assigned trip to ${reqInfo.destination} was cancelled.`);
            }
          }
        }
      }
    }
    
    res.json({ message: "Status updated and availability synced." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/requests/:id/gate-status', async (req, res) => {
  try {
    const { gate_status } = req.body;
    let query = "UPDATE requests SET gate_status = ?";
    const params = [gate_status];
    
    if (gate_status === 'DEPARTED') {
      query += ", gate_departed_at = CURRENT_TIMESTAMP";
    } else if (gate_status === 'RETURNED') {
      query += ", gate_returned_at = CURRENT_TIMESTAMP";
    }
    
    query += " WHERE id = ?";
    params.push(req.params.id);

    await db.run(query, params);
    await logAudit('SECURITY', `Request #${req.params.id} marked as ${gate_status} by security guard.`);
    res.json({ message: "Gate status updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/requests/assign/:id', async (req, res) => {
  try {
    const { driver_id, vehicle_id } = req.body;
    const requestId = req.params.id;
    
    await db.run("UPDATE requests SET driver_id = ?, vehicle_id = ?, status = 'APPROVED' WHERE id = ?", [driver_id, vehicle_id, requestId]);
    
    // Notify Employee
    const reqInfo = await db.get("SELECT employee_id, destination FROM requests WHERE id = ?", [requestId]);
    if (reqInfo) {
      await pushNotification(reqInfo.employee_id, 'success', `Your vehicle request for ${reqInfo.destination} has been approved.`);
    }
    
    // Notify Driver
    const driverInfo = await db.get("SELECT phone_number, first_name, last_name FROM drivers WHERE id = ?", [driver_id]);
    if (driverInfo) {
      const driverUser = await db.get("SELECT id FROM users WHERE phone_number = ? AND role = 'DRIVER'", [driverInfo.phone_number]);
      if (driverUser) {
        await pushNotification(driverUser.id, 'info', `You have been assigned to a new trip #REQ-${requestId}.`);
      }
    }
    
    
    // Notify Security Guards in the branch
    if (reqInfo) {
      const userRow = await db.get("SELECT branch FROM users WHERE id = ?", [reqInfo.employee_id]);
      if (userRow && userRow.branch) {
        const securityGuards = await db.all("SELECT id FROM users WHERE role = 'SECURITY' AND branch = ?", [userRow.branch]);
        const vehicleInfo = await db.get("SELECT license_plate FROM vehicles WHERE id = ?", [vehicle_id]);
        for (let guard of securityGuards) {
          const dName = driverInfo ? `${driverInfo.first_name} ${driverInfo.last_name}` : 'Unknown';
          await pushNotification(guard.id, 'warning', `Trip Assigned: Driver ${dName} heading to ${reqInfo.destination} with vehicle ${vehicleInfo ? vehicleInfo.license_plate : 'Unknown'}.`);
        }
      }
    }
    
    await logAudit('APPROVAL', `Request #${requestId} approved. Assigned Driver ${driver_id} and Vehicle ${vehicle_id}.`);
    res.json({ message: "Request approved and driver/vehicle assigned successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign driver and vehicle." });
  }
});

const sseClients = new Map();

async function pushNotification(userId, type, message) {
  try {
    const result = await db.run(`INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)`, [userId, type, message]);
    const newNotif = await db.get(`SELECT * FROM notifications WHERE id = ?`, [result.lastID]);
    
    const clients = sseClients.get(String(userId));
    if (clients) {
      clients.forEach(res => res.write(`data: ${JSON.stringify(newNotif)}\n\n`));
    }
  } catch (error) {
    console.error("Failed to push notification:", error);
  }
}

app.get('/api/notifications/stream/:user_id', (req, res) => {
  const userId = String(req.params.user_id);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(res);

  req.on('close', () => {
    if (sseClients.has(userId)) {
      sseClients.get(userId).delete(res);
    }
  });
});

// Notifications API
app.get('/api/notifications/:user_id', async (req, res) => {
  try {
    const notifs = await db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50", [req.params.user_id]);
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await db.all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ message: "Notification marked as read" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Settings Endpoints
app.put('/api/users/profile/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number } = req.body;
    await db.run("UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE id = ?",
      [first_name, last_name, email, phone_number, req.params.id]);
    await logAudit('MUTATION', `User profile updated for user ID ${req.params.id}.`);
    
    const updatedUser = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    res.json(updatedUser);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/settings/system', async (req, res) => {
  try {
    const settings = await db.get("SELECT * FROM system_settings WHERE id = 1");
    res.json(settings || {});
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/settings/system', async (req, res) => {
  try {
    const { require_manager_approval, auto_assign_drivers, maintenance_alerts } = req.body;
    await db.run("UPDATE system_settings SET require_manager_approval = ?, auto_assign_drivers = ?, maintenance_alerts = ? WHERE id = 1",
      [require_manager_approval ? 1 : 0, auto_assign_drivers ? 1 : 0, maintenance_alerts ? 1 : 0]);
    await logAudit('MUTATION', `Global system preferences updated.`);
    res.json({ message: "System settings updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/settings/notifications/:userId', async (req, res) => {
  try {
    let settings = await db.get("SELECT * FROM user_settings WHERE user_id = ?", [req.params.userId]);
    if (!settings) {
      await db.run("INSERT INTO user_settings (user_id) VALUES (?)", [req.params.userId]);
      settings = await db.get("SELECT * FROM user_settings WHERE user_id = ?", [req.params.userId]);
    }
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reports/automated', async (req, res) => {
  try {
    const reports = await db.all("SELECT * FROM automated_reports ORDER BY report_date DESC LIMIT 30");
    res.json(reports);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Geofence Settings Endpoints
app.get('/api/settings/geofence/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    let settings = await db.get("SELECT * FROM branch_settings WHERE branch = ?", [branch]);
    if (!settings) {
      settings = { branch, geofence_lat: null, geofence_lng: null, geofence_radius_km: 20.0 };
    }
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings/geofence/:branch', async (req, res) => {
  try {
    const { branch } = req.params;
    const { geofence_lat, geofence_lng, geofence_radius_km } = req.body;
    
    await db.run(
      `INSERT INTO branch_settings (branch, geofence_lat, geofence_lng, geofence_radius_km) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT (branch) DO UPDATE SET 
       geofence_lat = EXCLUDED.geofence_lat, 
       geofence_lng = EXCLUDED.geofence_lng, 
       geofence_radius_km = EXCLUDED.geofence_radius_km`,
      [branch, geofence_lat, geofence_lng, geofence_radius_km]
    );
    
    await logAudit('SETTINGS', `Updated geofence settings for branch: ${branch}`);
    res.json({ message: "Geofence settings updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings/notifications/:userId', async (req, res) => {
  try {
    const { email_notif, sms_notif, push_notif } = req.body;
    await db.run("UPDATE user_settings SET email_notif = ?, sms_notif = ?, push_notif = ? WHERE user_id = ?",
      [email_notif ? 1 : 0, sms_notif ? 1 : 0, push_notif ? 1 : 0, req.params.userId]);
    res.json({ message: "Notification rules updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

process.on('SIGINT', async () => {
  if (db && typeof db.close === 'function') await db.close();
  process.exit(0);
});

const outOfBoundsVehicles = new Set();

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const vehicleLastPing = new Map();

const startServer = async () => {
  try {
    await initDB();
    
    io.on('connection', (socket) => {
      console.log('Client connected for live tracking');
      
      socket.on('driver_location_update', async (data) => {
        const now = Date.now();
        const lastPing = vehicleLastPing.get(data.vehicle_id) || 0;
        
        // Rate Limiter: Process max 1 location ping per 2 seconds per vehicle
        if (now - lastPing < 2000) return;
        vehicleLastPing.set(data.vehicle_id, now);

        socket.broadcast.emit('vehicle_location_updated', data);
        
        try {
          await db.run(
            `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, last_updated) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT (vehicle_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, last_updated = CURRENT_TIMESTAMP RETURNING vehicle_id`,
            [data.vehicle_id, data.latitude, data.longitude]
          );
          
          // Geofencing Check
          const vehicle = await db.get("SELECT branch, license_plate FROM vehicles WHERE id = ?", [data.vehicle_id]);
          if (vehicle && vehicle.branch) {
             const settings = await db.get("SELECT * FROM branch_settings WHERE branch = ?", [vehicle.branch]);
             if (settings && settings.geofence_lat && settings.geofence_lng && settings.geofence_radius_km) {
                const dist = calculateHaversineDistance(settings.geofence_lat, settings.geofence_lng, data.latitude, data.longitude);
                if (dist > settings.geofence_radius_km) {
                   if (!outOfBoundsVehicles.has(data.vehicle_id)) {
                      outOfBoundsVehicles.add(data.vehicle_id);
                      const admins = await db.all("SELECT id FROM users WHERE role = 'BRANCH_ADMIN' AND branch = ?", [vehicle.branch]);
                      for (const admin of admins) {
                         await pushNotification(admin.id, 'danger', `GEOFENCE ALERT: Vehicle ${vehicle.license_plate} is ${Math.round(dist)}km outside the operational zone!`);
                      }
                      await logAudit('GEOFENCE_VIOLATION', `Vehicle ${vehicle.license_plate} traveled ${Math.round(dist)}km outside the allowed zone.`);
                   }
                } else {
                   if (outOfBoundsVehicles.has(data.vehicle_id)) {
                      outOfBoundsVehicles.delete(data.vehicle_id);
                   }
                }
             }
          }
        } catch (e) {
          console.error("Socket DB Save Error:", e.message);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error(err);
  }
};

// Schedule Daily CRON Job at Midnight
cron.schedule('0 0 * * *', async () => {
  try {
    console.log("Running Daily Automated Analytics CRON Job...");
    // Since we are using Postgres `CURRENT_DATE`, we can just get today's data
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

    await db.run(`
      INSERT INTO automated_reports (report_date, total_trips, total_fuel_consumed, total_distance)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (report_date) DO UPDATE SET
      total_trips = EXCLUDED.total_trips,
      total_fuel_consumed = EXCLUDED.total_fuel_consumed,
      total_distance = EXCLUDED.total_distance
    `, [today, totalTrips, totalFuel, totalDist]);

    await logAudit('SYSTEM_REPORT', `Generated daily automated report for ${today}. Trips: ${totalTrips}, Fuel: ${totalFuel}L.`);

    const admins = await db.all("SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'BRANCH_ADMIN')");
    for (const admin of admins) {
      await pushNotification(admin.id, 'info', `Daily Analytics generated for ${today}: ${totalTrips} trips completed.`);
    }
  } catch (err) {
    console.error("Failed to run CRON job:", err);
  }
});

startServer();