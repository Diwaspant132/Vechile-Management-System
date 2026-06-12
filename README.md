# 🚐 Nepal Telecom (NTC) Enterprise Vehicle Management System

An enterprise-grade, multi-tenant fleet management and telemetry platform designed specifically for Nepal Telecom (NTC). This system provides strict data isolation across different regional branches (Jawalakhel, Babar Mahal, etc.), ensuring secure, role-based access for fleet administrators, drivers, and employees.

---

## ✨ Key Features

* **Strict Multi-Branch Data Isolation:** Queries and dashboards are cryptographically scoped to the authenticated user's branch. A Branch Admin at Babar Mahal cannot view or alter vehicles, drivers, or tracking data belonging to Jawalakhel.
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
* Bootstrap 5 & Vanilla CSS (Responsive UI/UX)
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

---

## 🔒 Security Posture
* **JWT Branch Injection:** Authentication tokens carry encrypted branch metadata, making frontend spoofing impossible.
* **Route Guards:** React strictly enforces `ProtectedRoute` wrappers to prevent unauthorized URL manipulation.
* **Audit Logging:** Sensitive mutations (approving employees, assigning drivers, transferring vehicles) are permanently logged for Super Admin oversight.

---

## 📝 License
Proprietary software developed for internal fleet management operations.
