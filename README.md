# SecureSend — HIPAA-Aligned Secure Document Sharing

CS 419: Secure Web Application Project 

SecureSend is a secure document sharing platform designed for law firms to share confidential medical records with physicians. All documents are encrypted at rest using AES-256-CBC and transmitted over TLS. The system implements role-based access control, comprehensive audit logging, and HIPAA-aligned security controls.

---

## Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@12345! | Admin — full access + user management |
| lawyer | Lawyer@12345! | User — upload, share, download |
| doctor | Doctor@12345! | Guest — view shared documents only |

---

## Tech Stack

**Frontend:** React (Vite), Axios
**Backend:** Node.js, Express
**Encryption:** AES-256-CBC (documents), bcrypt cost 12 (passwords), TLS via self-signed certificate (transport)
**Auth:** JSON Web Tokens (JWT), 30-minute session expiry
**Storage:** JSON files — no database required

---

## Project Structure

```
compsecproj/
├── README.md
├── client/                        # React frontend
│   ├── index.html                 # HTML entry point
│   ├── eslint.config.js
│   ├── vite.config.js
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # All frontend components
│       ├── App.css
│       ├── index.css
│       └── assets/                # Images and icons
├── server/                        # Express backend
│   ├── app.js                     # Main server — all routes, middleware, encryption
│   ├── package.json
│   ├── cert.pem                   # TLS certificate (self-signed, generate locally)
│   ├── key.pem                    # TLS private key (self-signed, generate locally)
│   ├── data/
│   │   ├── users.json             # User accounts (bcrypt hashed passwords)
│   │   ├── sessions.json          # Active sessions with expiry timestamps
│   │   ├── documents.json         # Document metadata
│   │   └── encrypted_docs/        # AES-256 encrypted .enc files
│   └── logs/
│       ├── security.log           # All security events
│       └── access.log             # PHI access audit trail (HIPAA)
├── docs/
│   ├── security_design.pdf
│   ├── pentest_report.pdf
│   └── presentation.pdf
└── tests/                         # Manual pen test notes
```

---

## Setup Instructions

### Prerequisites
- Node.js v20+
- npm
- openssl (pre-installed on Mac/Linux)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd compsecproj
```

### 2. Set up the backend

```bash
cd server
npm install
```

Generate a self-signed TLS certificate:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/CN=localhost"
```

Start the server:

```bash
node app.js
```

You should see:
```
SecureSend backend running on https://localhost:3001
CORS: allowing http://localhost:5173
Security headers: X-Frame-Options, CSP, XSS-Protection, etc.
Rate limiting: 10 requests/min on /api/login
Encryption: AES-256-CBC
```

> **Important:** The TLS certificate is self-signed so your browser will show a security warning. Go to **https://localhost:3001** directly, click **Advanced → Proceed to localhost**, then return to the app. This only needs to be done once per browser session.

### 3. Set up the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The app runs at **http://localhost:5173**

---

## Port Configuration

The backend runs on port **3001** (not 5000) because macOS uses port 5000 for AirPlay Receiver. If port 3001 is also in use:

1. Change `const PORT = 3001` in `server/app.js`
2. Change `const API = "https://localhost:3001/api"` in `client/src/App.jsx`

---

## Environment Variables

In production, set these instead of using the hardcoded development fallbacks:

```bash
export ENCRYPTION_KEY="your-long-random-key-here"
export JWT_SECRET="your-long-random-secret-here"
```

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt, cost factor 12 |
| Account lockout | 5 failed attempts → 15 min lockout |
| Rate limiting | Max 10 login attempts/min per IP |
| Session management | JWT, 30 min expiry, saved to sessions.json |
| Session cleanup | Expired sessions purged on logout |
| Encryption at rest | AES-256-CBC with random IV per file |
| Transport encryption | TLS via self-signed certificate |
| Access control | RBAC: admin / user / guest |
| Password requirements | Min 12 chars, uppercase, lowercase, number, special character (!@#$%^&*) |
| Security headers | CSP, X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, Permissions-Policy |
| File size limit | Max 50MB per upload |
| Error handling | Custom JSON error responses, no stack trace exposure |
| Framework fingerprinting | x-powered-by header disabled |
| Audit logging | security.log + access.log (HIPAA PHI trail) |
| HIPAA audit export | Admin can download full audit log |
| File upload validation | Extension + MIME type whitelist (PDF/DOCX only) |
| Path traversal prevention | safeName() strips directory components |

---

## Role Permissions

| Feature | Admin | User | Guest |
|---------|-------|------|-------|
| Upload documents | ✓ | ✓ | ✗ |
| Download own documents | ✓ | ✓ | ✗ |
| Download shared documents | ✓ | ✓ | ✓ |
| Share documents | ✓ | ✓ | ✗ |
| Delete own documents | ✓ | ✓ | ✗ |
| Delete any document | ✓ | ✗ | ✗ |
| View all documents | ✓ | ✗ | ✗ |
| Manage users | ✓ | ✗ | ✗ |
| Export audit logs | ✓ | ✗ | ✗ |

---

## Known Limitations

- Self-signed TLS certificate causes browser warning — production needs CA-signed cert
- Encryption key uses hardcoded dev fallback — production must use `ENCRYPTION_KEY` env var
- No email verification on registration
- No password reset flow
- No document versioning — re-uploading the same file creates a duplicate entry rather than replacing the original
- JWT tokens are not invalidated server-side on logout — a stolen token remains valid until its 30-minute expiry because `requireAuth` only verifies the JWT signature and does not check `sessions.json`
- Logs stored on same server — production should use remote log aggregation