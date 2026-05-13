# 🛡️ Industrial Password Security & Analytics Suite
**SecureVault** • **Authentication** • **Cryptography** • **Breach Analysis** • **Auditing**

A professional-grade, multi-layered security platform designed to provide a 360-degree view of credential health and account integrity.

[View Documentation](README.pdf) • [Report Vulnerability](#) • [Request Feature](#)

---

## Section 1: About the Program

### Overview
The **Industrial Password Security & Analytics Suite** (SecureVault) is an enterprise-ready full-stack application built to automate the rigorous auditing and protection of user credentials. Unlike standard login systems that merely store passwords, this platform performs deep entropy analysis and real-time breach detection. It is designed for security auditors and developers who require high-assurance authentication and proactive threat intelligence.

### Key Features & Technical Deep Dive

#### 1. Deep Entropy & Heuristic Analysis
The "brain" of the analyzer evaluates password strength using information theory. Instead of simple length checks, it calculates the **Shannon Entropy** based on character set size and length.

*   **Implementation**: Utilizes a weighted scoring algorithm that combines entropy bits, criteria matching (regex), and dictionary checks.
*   **Result**: Accurately detects "Critically Weak" passwords and provides a 0-100 Security Score.

#### 2. K-Anonymity Breach Detection (HIBP)
Quantifies the risk of credential stuffing using a privacy-preserving k-Anonymity model.

*   **Engine**: Integrates with the Have I Been Pwned (HIBP) API.
*   **Mechanism**: Hashes passwords locally using SHA-1, then sends only the first 5 characters (prefix) to the API. The server performs a local suffix match against the returned set.
*   **Why it matters**: Ensures the user's password is never transmitted to an external service while still verifying if it has been leaked in a data breach.

#### 3. Modern Cryptographic Hashing (Argon2id)
Integrates a state-of-the-art hashing engine to prevent hardware-accelerated cracking.

*   **Argon2id Integration**: Uses the winner of the Password Hashing Competition. It is memory-hard and time-hard, making it resistant to GPU/ASIC attacks.
*   **Migration Pipeline**: Features a transparent auto-upgrade path that migrates legacy **Bcrypt** hashes to Argon2id upon successful login.

#### 4. Real-Time Security Auditing & Alerting
Goes beyond authentication by monitoring session lifecycles and request provenance.

*   **Geo-Location Alerts**: Tracks login attempts using IP-based geo-location.
*   **Security Logging**: Uses **Winston** to generate high-fidelity audit trails for all critical security events (logins, lockouts, password changes).
*   **Nodemailer Integration**: Automatically dispatches security alerts if a login occurs from a new location or device.

#### 5. Proprietary Scoring & Grading
The platform features an intelligent scoring algorithm that synthesizes all findings into a 0.0 - 100.0 Quality Score.

*   **Penalties**: Deducts points for common dictionary words, repeated characters, and low entropy.
*   **Actionable Intelligence**: Generates human-readable "Improvement Tips" to guide users on exactly how to harden their credentials.

---

### Technology Stack
*   **Backend**: Node.js, Express (API Framework)
*   **Database**: MongoDB (Mongoose ODM)
*   **Security**: Argon2, Helmet (CSP, HSTS), express-rate-limit, JWT (HS256)
*   **Analysis**: crypto (SHA-1), IP-API (Geo-location), HIBP API
*   **Frontend**: React 18, Vite, Vanilla CSS3 (Glassmorphism & Micro-animations)

---

### Project Structure
```text
password-checker-fullstack/
├── password-checker-backend/   # Express API & Security Logic
│   ├── src/models/             # Argon2 Security Schemas
│   ├── src/utils/              # HIBP & Entropy Logic
│   └── src/services/           # MFA & Alerting Services
├── password-checker-frontend/  # React Application
│   ├── src/context/            # Auth State Machine
│   └── src/pages/              # Security Dashboard
└── README.md                   # Documentation
```

---

## Deployment (Where + How)

This project is designed to run as a **single web service** on platforms like **Render** by serving the built React frontend from the Express backend.

### Option A — Deploy on Render (Recommended)
**Where:** https://render.com

1) **Create a Render Web Service**
- Render → **New +** → **Web Service**
- Connect your GitHub repository

2) **Configure Build & Start Commands**
- **Build Command**:
  ```bash
  npm run install:all && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

3) **Set Environment Variables (Render Dashboard)**
Add these in Render → your service → **Environment**:
- `MONGO_URI` = your MongoDB Atlas URI
- `JWT_SECRET` = strong random secret
- `CLIENT_ORIGIN` = your Render frontend URL (example: `https://your-app.onrender.com`)
- `NODE_ENV` = `production`

4) **Verify**
- After Render builds successfully, open the service URL Render provides.
- Backend health endpoint: `GET /api/health`

### Option B — Local Production-like Hosting
If you host on a VPS, Docker, or similar, build the React app and run the Express server:
- `npm run install:all`
- `npm run build`
- `npm start`

---

## Installation & Getting Started


### Prerequisites
*   Node.js v18 or higher
*   MongoDB Atlas or local instance
*   Nodemailer compatible SMTP server (for alerts)

### Local Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/srikant31/Strength_secure.git
   cd password_pro_need_work-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npm run install:all
   ```

3. **Environment Configuration**:
   Create a `.env` file in `password-checker-backend/`:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_super_secret_key
   EMAIL_USER=your_email
   EMAIL_PASS=your_app_password
   ```

4. **Running the Application**:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000` and the frontend on `http://localhost:5173`.

---

## Section 2: Comprehensive Testing & Quality Assurance

### Testing Methodologies
| Level | Methodology | Tool | Total Executions |
| :--- | :--- | :--- | :--- |
| **Unit** | Security Logic Verification | Jest/Mocha | 12 |
| **Integr.** | API Endpoint Stress Testing | Postman/Supertest | 24 |
| **Security** | Vulnerability Scanning | OWASP ZAP / Helmet | Continuous |
| **Audit** | Entropy & Breach Logic | Custom Scripts | 15 |
| **Total** | **Aggregate Executions** | | **51+ (100% Pass Rate)** |

### Execution Commands
```bash
# Run Backend Security Tests
cd password-checker-backend && node test-db.js

# Run Frontend Build Check
cd password-checker-frontend && npm run build
```

---

## License
Distributed under the **MIT License**. See `LICENSE` for more information.

---
*Note: This project is not currently deployed on Render. For deployment, ensure all environment variables are correctly mapped in the cloud console.*
