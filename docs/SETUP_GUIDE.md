# Academic Progress and Achievement Tracking System (ATS)
## Complete Setup, Cloud Database Integration & Production Runbook

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (Installed: `v24.18.0`)
- **npm:** v9.0.0 or higher (Installed: `11.16.0`)
- **Aiven Cloud MySQL Service:** An active MySQL service on [Aiven.io](https://aiven.io) (Free tier or standard tier).
- **Python (Optional):** Python 3.8+ if enabling subprocess AI execution. (The system includes an automatic native Node.js heuristic AI engine that operates seamlessly without Python).

---

## 2. Quick Start (3 Steps)

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Open `.env` in your text editor and fill in your Aiven Cloud MySQL connection parameters:
```env
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=ats_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h

# Aiven Cloud MySQL Credentials
DB_HOST=mysql-xxxxxxxx-your-account.aivencloud.com
DB_PORT=18334
DB_USER=avnadmin
DB_PASSWORD=your_actual_aiven_password
DB_NAME=defaultdb
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Step 2: Run Database Migration
Execute the automated migration runner to create all 9 normalized relational tables and populate initial reference college data:
```powershell
npm run migrate
```
*Expected Output:*
```
Applying database schema (schema.sql)...
✅ Schema tables verified/created successfully.
Seeding reference and college data (college_data.sql)...
✅ Seed data applied idempotently.
Table [departments   ]: 4 rows
Table [users         ]: 4 rows
Table [students      ]: 2 rows
Table [subjects      ]: 6 rows
Table [marks         ]: 12 rows
Table [attendance    ]: 12 rows
Table [achievements  ]: 6 rows
🎉 Migration completed successfully!
```

### Step 3: Launch the Application
Start the unified ATS web server:
```powershell
npm start
```
Open your browser and navigate to:
- **Application Portal:** `http://localhost:3000`
- **Login Portal:** `http://localhost:3000/login.html`
- **Health Diagnostic:** `http://localhost:3000/api/health`

---

## 3. Pre-Seeded Demonstration Accounts

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Student (Honors)** | `ishita_sharma` | `Password123!` | Top student with 8.53 CGPA, 87% attendance, 6 verified achievements, and strong AI mastery markers. |
| **Student (At-Risk)** | `arun_kumar` | `Password123!` | Academic intervention student with low Operating Systems attendance (60%) and failing marks for testing alert systems. |
| **Faculty Member** | `prof_ramesh` | `Password123!` | Faculty advisor with permission to inspect all departmental students and record marks/attendance. |
| **Administrator** | `admin_principal` | `AdminPassword123!` | Institutional admin with access to institution-wide overviews, department metrics, and at-risk registries. |

*(Note: On `login.html`, click the quick-fill pills to instantly load demo credentials).*

---

## 4. Running Automated Tests

Run the automated test suite anytime to verify all 13 security, API, and academic algorithms:
```powershell
npm test
```

---

## 5. Troubleshooting Aiven Cloud MySQL Connections

If `GET /api/health` reports status `degraded` or `npm run migrate` reports an error, consult the category mapping below:

| Failure Category | Likely Cause | Solution |
|---|---|---|
| `DNS_RESOLUTION_FAILED` | Typos in `DB_HOST`. | Check host URI in Aiven Console (e.g. `mysql-....aivencloud.com`). Ensure there are no spaces or `mysql://` prefixes. |
| `HOST_OR_PORT_UNREACHABLE` | Incorrect `DB_PORT` or local firewall blocking outbound port. | Verify port in Aiven Console (usually a 5-digit number like `18334`, not `3306`). |
| `AUTHENTICATION_FAILED` | Incorrect `DB_USER` or `DB_PASSWORD`. | Reset password in Aiven Console and copy exact password into `.env`. |
| `TLS_CERTIFICATE_VERIFICATION_FAILED` | Node.js rejecting Aiven's self-signed root CA. | Ensure `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=false` in `.env`. Alternatively, download `ca.pem` from Aiven Console and set `DB_SSL_CA=./ca.pem`. |
| `DATABASE_NOT_FOUND_OR_FORBIDDEN` | Target database doesn't exist. | By default, Aiven provides `defaultdb`. Ensure `DB_NAME=defaultdb` in `.env`. |

---

*End of Setup Guide.*
