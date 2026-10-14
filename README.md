# Academic Progress and Achievement Tracking System (ATS)

An integrated, enterprise-grade academic monitoring web application featuring student performance tracking, attendance analysis, achievements tracking, role-based access control, Aiven Cloud MySQL persistence, and an intelligent academic AI assistant.

---

## 🚀 Quick Start

1. **Install Dependencies:**
   ```powershell
   npm install
   ```

2. **Configure Environment:**
   ```powershell
   Copy-Item .env.example .env
   # Update .env with your Aiven Cloud MySQL credentials
   ```

3. **Run Database Migrations:**
   ```powershell
   npm run migrate
   ```

4. **Start the Application:**
   ```powershell
   npm start
   ```
   Open `http://localhost:3000` in your web browser.

5. **Run Verification Tests:**
   ```powershell
   npm test
   ```

---

## 📚 Documentation Index

- [Project Audit Report](docs/PROJECT_AUDIT.md) — Comprehensive forensic analysis of the workspace and recovery log.
- [System Architecture](docs/ARCHITECTURE.md) — Unified single-origin architecture and data flow diagrams.
- [REST API Inventory](docs/API_INVENTORY.md) — Complete endpoint schemas and contract specification.
- [Database Audit & 3NF Schema](docs/DATABASE_AUDIT.md) — Relational model, credit-weighted GPA calculations, and Aiven compatibility.
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Phased engineering roadmap.
- [Test Execution Report](docs/TEST_REPORT.md) — Results of the automated verification test suite (13/13 Passed).
- [Setup & Troubleshooting Guide](docs/SETUP_GUIDE.md) — Production deployment runbook and Aiven configuration.
