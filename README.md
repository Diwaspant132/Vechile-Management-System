# 🚐 Nepal Telecom (NTC) Enterprise Vehicle Management System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/bootstrap-%238511FA.svg?style=for-the-badge&logo=bootstrap&logoColor=white)

An enterprise-grade, multi-tenant fleet management and telemetry platform designed specifically for Nepal Telecom (NTC). This system provides strict data isolation across different regional branches (Jawalakhel, Babar Mahal, etc.), ensuring secure, role-based access for fleet administrators, drivers, and employees.

---

## 📸 Screenshots

### 1. Global Monitoring Dashboard
<img src="https://raw.githubusercontent.com/Diwaspant132/Vechile-Management-System/main/assets/5_global_dashboard.png" width="800">

### 2. Live GPS Tracking & Telemetry
<img src="https://raw.githubusercontent.com/Diwaspant132/Vechile-Management-System/main/assets/1_live_tracking.png" width="800">

### 3. Role-Based Fleet Analytics
<img src="https://raw.githubusercontent.com/Diwaspant132/Vechile-Management-System/main/assets/2_reports_analytics.png" width="800">

### 4. Branch-Isolated Request Management
<img src="https://raw.githubusercontent.com/Diwaspant132/Vechile-Management-System/main/assets/3_request_management.png" width="800">

### 5. Driver Trip Management Console
<img src="https://raw.githubusercontent.com/Diwaspant132/Vechile-Management-System/main/assets/4_trip_management.png" width="800">

---

## ✨ Key Features

* **Strict Multi-Branch Data Isolation:** Queries and dashboards are cryptographically scoped to the authenticated user's branch. A Branch Admin at Babar Mahal cannot view or alter vehicles, drivers, or tracking data belonging to Jawalakhel.
* **Premium Dynamic UI & Theme Management:** Completely overhauled interface featuring modern glassmorphism, fluid micro-animations, and a seamless, zero-flicker **Dark Mode** toggle with persistent system-theme synchronization.
* **Role-Based Access Control (RBAC):** Five distinct operational roles:
  * 👑 **Super Admin:** Global oversight, system-wide analytics, and cross-branch transfer approvals.
  * 🏢 **Branch Admin:** Full autonomous control over their specific branch's requests, drivers, and fleet.
  * 🚛 **Transport Officer:** Operational oversight of logistics.
  * 🚙 **Driver:** Dedicated portals for active trip management, live location broadcasting, and fuel logging.
  * 🧑‍💻 **Employee:** Streamlined interface for requesting vehicle dispatches.
* **Real-Time Live Tracking:** Integrated `react-leaflet` telemetry. Live maps automatically isolate active GPS blips to the admin's regional jurisdiction.
* **Enterprise Analytics:** Comprehensive reporting dashboards using `Recharts` for fuel variance, maintenance TCO (Total Cost of Ownership), and vehicle utilization metrics.
* **Identity Resolution:** Dual-factor database verification (Phone Number + First Name) prevents profile collisions among drivers and employees.

---

## 🛠️ Technology Stack

**Frontend:**
* React 18 (Vite)
* React Router v6 (Protected Routing)
* Context API (Global Theme & State Management)
* Bootstrap 5 & Vanilla CSS (Responsive UI/UX & Glassmorphism)
* Lucide React (Iconography)
* React-Leaflet (Live GPS Tracking Maps)
* Recharts (Analytics Data Visualization)

**Backend:**
* Node.js & Express.js
* SQLite3 (Development / Production-Ready for local scaling)
* JWT (JSON Web Tokens) for Stateless, Branch-Aware Authentication
* Multer (For Driver License/Document Uploads)
* RESTful API Architecture

---

## 🚀 Installation & Setup

### Prerequisites
* Node.js (v16.x or higher)
* Git

### 1. Clone the Repository
```bash
git clone https://github.com/Diwaspant132/Vechile-Management-System.git
cd Vechile-Management-System
```

### 2. Backend Setup
```bash
cd ntc-fleet-backend
npm install
```
*The SQLite database (`ntc_vms.db`) will auto-initialize on the first run with default NTC branches and Super Admin accounts.*
```bash
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd ntc-fleet-frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🗄️ Database Architecture & Migration
Currently, the system is backed by **SQLite** for rapid deployment and file-based portability. The entire backend query architecture utilizes standard SQL (`JOIN`, `WHERE`, `SELECT`) making it **95% ready for a PostgreSQL migration** should NTC require high-concurrency enterprise scaling in the future.

### Key Database Schemas
* **`users` & `drivers`:** Dual-table identity management separating standard NTC employees/admins from operational fleet drivers, linked by unique phone numbers and branch assignments.
* **`requests` & `trips`:** Tracks the lifecycle of a vehicle request from "Pending Employee Submission" to "Branch Admin Approval" to "Active Driver Trip".
* **`vehicle_locations`:** High-throughput telemetry table storing latitude/longitude pings and timestamps from active driver devices for live tracking.
* **`notifications`:** Role-based alert system schema supporting unread/read state mutations for instant UI feedback.
* **`audit_logs`:** Immutable ledger tracking sensitive system mutations (vehicle transfers, employee approvals, driver assignments) for compliance and security oversight.

---

## 🔒 Security Posture
* **JWT Branch Injection:** Authentication tokens carry encrypted branch metadata, making frontend spoofing impossible.
* **Route Guards:** React strictly enforces `ProtectedRoute` wrappers to prevent unauthorized URL manipulation.
* **Audit Logging:** Sensitive mutations (approving employees, assigning drivers, transferring vehicles) are permanently logged for Super Admin oversight.

---

## 📝 License
Proprietary software developed for internal fleet management operations.
