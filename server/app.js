//these are the imports! they load a package installed to help handle a particular task
const express = require("express"); //first this is the web framework we use to create the server and handle requests
const bcrypt = require("bcryptjs"); //bcrypt is a library for hashing passwords securely
const jwt = require("jsonwebtoken"); //jsonwebtoken is used to create and verify JSON Web Tokens for authentication
const rateLimit = require("express-rate-limit"); //express-rate-limit is a middleware to limit repeated requests to public APIs and/or endpoints such as password reset
const multer = require("multer"); //multer is a middleware for handling multipart/form-data, which is primarily used for uploading files
const crypto = require("crypto"); //crypto is a built-in Node.js module that provides cryptographic functionality, including encryption and hashing
const fs = require("fs"); //fs is a built-in Node.js module for interacting with the file system
const path = require("path"); //path is a built-in Node.js module for handling and transforming file paths
const { v4: uuidv4 } = require("uuid"); //uuid is a library for generating unique identifiers, we use version 4 which generates random UUIDs

const app = express(); // create an instance of the Express application
const PORT = 3001; // define the port number the server will listen on

//creating encryption key
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || "securesend-master-key",
  "salt",
  32
);
const JWT_SECRET = process.env.JWT_SECRET || "securesend-jwt-secret-change-in-production";

//security headers! these headers help protect against common web vulnerabilities like clickjacking, MIME sniffing, XSS, and more.
app.use((req, res, next) => {
  res.header("X-Frame-Options", "DENY");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");
  res.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  next();
});

//cors headers! these headers allow the frontend running on a different origin (http://localhost:5173) to make requests to this backend, while still enforcing security by only allowing that specific origin and supporting credentials like cookies or authorization headers.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

//rate limiter for login endpoint to prevent brute-force attacks! limited to 10 attempts per min
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in a minute." }
});

//multer setup for file uploads, using memory storage and limiting file size to 50MB, also filtering to only allow PDF and DOCX files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".docx"];
    const allowedMimes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext) || !allowedMimes.includes(file.mimetype)) {
        return cb(new Error("Only PDF and DOCX files are allowed"));
    }
    cb(null, true);
}
});

//directories setup!
["data", "logs", "data/encrypted_docs"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

//reading file
const readJSON = (file) => {
  const full = path.join(__dirname, "data", file);
  if (!fs.existsSync(full)) return [];
  const content = fs.readFileSync(full, "utf8").trim();
  if (!content) return [];
  return JSON.parse(content);
};

const writeJSON = (file, data) => {
  const full = path.join(__dirname, "data", file);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
};

//encrypt decrypt
const encryptFile = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
};

const decryptFile = (encryptedBuffer) => {
  const iv = encryptedBuffer.slice(0, 16);
  const encrypted = encryptedBuffer.slice(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

//sanitize filename to prevent directory traversal and other issues, only allowing alphanumeric, dashes, underscores, and dots
const safeName = (filename) => {
  const base = path.basename(filename);
  const sanitized = base.replace(/[^\w\-\.]/g, "_");
  if (!sanitized || sanitized === "." || sanitized === "..") throw new Error("Invalid filename");
  return sanitized;
};

//logging security events! 
const logEvent = (event, username, detail, severity = "INFO") => {
  const entry = {
    timestamp: new Date().toISOString(),
    severity,
    event,
    username,
    detail,
  };
  fs.appendFileSync(
    path.join(__dirname, "logs", "security.log"),
    JSON.stringify(entry) + "\n"
  );
  if (["DOC_UPLOAD", "DOC_DOWNLOAD", "DOC_SHARE", "DOC_DELETE"].includes(event)) {
    fs.appendFileSync(
      path.join(__dirname, "logs", "access.log"),
      JSON.stringify(entry) + "\n"
    );
  }
  console.log(`[${severity}] ${event} — ${username} — ${detail}`);
};

//authentication middleware to protect routes, checks for JWT in Authorization header and verifies it, 
//attaching user info to req.user if valid, otherwise returns 401 Unauthorized. Also logs invalid token attempts.
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    logEvent("INVALID_TOKEN", "unknown", "Expired or invalid JWT", "WARNING");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    logEvent("ACCESS_DENIED", req.user.username, "Tried to access admin route", "WARNING");
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

//auth routes
// POST /api/register
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return res.status(400).json({ error: "Invalid username format" });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email format" });

  if (
    password.length < 12 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*]/.test(password)
  ) {
    logEvent("REGISTER_FAILED", username, "Password does not meet requirements", "WARNING");
    return res.status(400).json({ error: "Password does not meet requirements" });
  }

  const users = readJSON("users.json");

  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "Username already taken" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already registered" });

  const hash = bcrypt.hashSync(password, 12);

  const newUser = {
    id: uuidv4(),
    username,
    email,
    password: hash,
    role: "user",
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJSON("users.json", users);
  logEvent("REGISTER_SUCCESS", username, "New account created");
  res.json({ success: true });
});

// POST /api/login
app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readJSON("users.json");
  const user = users.find(u => u.username === username);

  if (!user) {
    logEvent("LOGIN_FAILED", username, "User not found", "WARNING");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    logEvent("LOGIN_BLOCKED", username, "Account locked", "WARNING");
    return res.status(403).json({ error: "Account locked. Try again in 15 minutes." });
  }

  const valid = bcrypt.compareSync(password, user.password);

  if (!valid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      logEvent("ACCOUNT_LOCKED", username, "5 failed login attempts", "ERROR");
    } else {
      logEvent("LOGIN_FAILED", username, `Attempt ${user.failedAttempts}/5`, "WARNING");
    }
    writeJSON("users.json", users);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  user.failedAttempts = 0;
  user.lockedUntil = null;
  writeJSON("users.json", users);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "30m" }
  );

  const sessions = readJSON("sessions.json");
  sessions.push({
    token,
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
  writeJSON("sessions.json", sessions);

  logEvent("LOGIN_SUCCESS", username, "Successful login");
  res.json({ token, user: { username: user.username, role: user.role } });
});

// POST /api/logout
app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  // Remove current session AND clean up expired sessions
  const sessions = readJSON("sessions.json").filter(s => 
    s.token !== token && new Date() < new Date(s.expiresAt)
  );
  writeJSON("sessions.json", sessions);
  logEvent("LOGOUT", req.user.username, "User logged out");
  res.json({ success: true });
});

//document routes
// GET /api/documents
app.get("/api/documents", requireAuth, (req, res) => {
  const docs = readJSON("documents.json");
  const userDocs = req.user.role === "admin"
    ? docs
    : docs.filter(d =>
        d.owner === req.user.username ||
        d.sharedWith.some(s => s.username === req.user.username)
        );
  const safe = userDocs.map(d => ({
    id: d.id,
    name: d.originalName,
    owner: d.owner,
    sharedWith: d.sharedWith,
    role: d.owner === req.user.username ? "owner" :
          d.sharedWith.find(s => s.username === req.user.username)?.role || "viewer",
    date: new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    encrypted: true,
  }));
  res.json(safe);
});

// POST /api/documents/upload
app.post("/api/documents/upload", requireAuth, upload.single("file"), (req, res) => {
  console.log("Upload route hit, file:", req.file?.originalname, "user:", req.user?.username);
  if (req.user.role === "guest") {
    logEvent("ACCESS_DENIED", req.user.username, "Guest tried to upload", "WARNING");
    return res.status(403).json({ error: "Guests cannot upload documents" });
  }

  if (!req.file) return res.status(400).json({ error: "No file provided" });

  try {
    const originalName = safeName(req.file.originalname);
    const docId = uuidv4();
    const encryptedName = `${docId}.enc`;
    const encryptedPath = path.join(__dirname, "data", "encrypted_docs", encryptedName);

    const encrypted = encryptFile(req.file.buffer);
    fs.writeFileSync(encryptedPath, encrypted);

    const docs = readJSON("documents.json");
    console.log("docs before push:", docs.length);
    docs.push({
      id: docId,
      originalName,
      encryptedPath: encryptedName,
      owner: req.user.username,
      sharedWith: [],
      createdAt: new Date().toISOString(),
      size: req.file.size,
    });
    console.log("docs after push:", docs.length);
    writeJSON("documents.json", docs);
    console.log("write path:", path.join(__dirname, "data", "documents.json"));

    logEvent("DOC_UPLOAD", req.user.username, `Uploaded ${originalName} (encrypted)`);
    res.json({ success: true, id: docId, name: originalName });

  } catch (err) {
    logEvent("DOC_UPLOAD_FAILED", req.user.username, err.message, "ERROR");
    res.status(400).json({ error: err.message });
  }
});

// GET /api/documents/:id/download
app.get("/api/documents/:id/download", requireAuth, (req, res) => {
  const docs = readJSON("documents.json");
  const doc = docs.find(d => d.id === req.params.id);

  if (!doc) return res.status(404).json({ error: "Document not found" });

  const isOwner = doc.owner === req.user.username;
  const isShared = doc.sharedWith.some(s => s.username === req.user.username);

  if (!isOwner && !isShared) {
    logEvent("ACCESS_DENIED", req.user.username, `Tried to download ${doc.originalName}`, "WARNING");
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const encryptedBuffer = fs.readFileSync(path.join(__dirname, "data", "encrypted_docs", doc.encryptedPath));
    const decrypted = decryptFile(encryptedBuffer);

    logEvent("DOC_DOWNLOAD", req.user.username, `Downloaded ${doc.originalName}`);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decrypted);

  } catch (err) {
    logEvent("DOC_DOWNLOAD_FAILED", req.user.username, err.message, "ERROR");
    res.status(500).json({ error: "Failed to decrypt document" });
  }
});

// POST /api/documents/:id/share
app.post("/api/documents/:id/share", requireAuth, (req, res) => {
  const { shareWith, role } = req.body;

  if (!shareWith || !["viewer", "editor"].includes(role))
    return res.status(400).json({ error: "Invalid share request" });

  const docs = readJSON("documents.json");
  const doc = docs.find(d => d.id === req.params.id);

  if (!doc) return res.status(404).json({ error: "Document not found" });

  if (doc.owner !== req.user.username) {
    logEvent("ACCESS_DENIED", req.user.username, "Non-owner tried to share", "WARNING");
    return res.status(403).json({ error: "Only the owner can share this document" });
  }

  const users = readJSON("users.json");
  const target = users.find(u => u.username === shareWith || u.email === shareWith);
  if (!target) return res.status(404).json({ error: "User not found" });

  const existing = doc.sharedWith.findIndex(s => s.username === target.username);
  if (existing >= 0) {
    doc.sharedWith[existing].role = role;
  } else {
    doc.sharedWith.push({ username: target.username, role });
  }

  writeJSON("documents.json", docs);
  logEvent("DOC_SHARE", req.user.username, `Shared ${doc.originalName} with ${target.username} (${role})`);
  res.json({ success: true });
});

// DELETE /api/documents/:id
app.delete("/api/documents/:id", requireAuth, (req, res) => {
  const docs = readJSON("documents.json");
  const doc = docs.find(d => d.id === req.params.id);

  if (!doc) return res.status(404).json({ error: "Document not found" });

  if (doc.owner !== req.user.username && req.user.role !== "admin") {
    logEvent("ACCESS_DENIED", req.user.username, "Tried to delete doc they don't own", "WARNING");
    return res.status(403).json({ error: "Access denied" });
  }

  const encPath = path.join(__dirname, "data", "encrypted_docs", doc.encryptedPath);
  if (fs.existsSync(encPath)) fs.unlinkSync(encPath);

  writeJSON("documents.json", docs.filter(d => d.id !== req.params.id));
  logEvent("DOC_DELETE", req.user.username, `Deleted ${doc.originalName}`);
  res.json({ success: true });
});

// admin routes
// GET /api/users
app.get("/api/users", requireAuth, requireAdmin, (req, res) => {
  const users = readJSON("users.json").map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.lockedUntil && new Date() < new Date(u.lockedUntil) ? "locked" : "active",
    createdAt: u.createdAt,
  }));
  res.json(users);
});

// PATCH /api/users/:id/lock
app.patch("/api/users/:id/lock", requireAuth, requireAdmin, (req, res) => {
  const users = readJSON("users.json");
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isLocked = user.lockedUntil && new Date() < new Date(user.lockedUntil);
  if (isLocked) {
    user.lockedUntil = null;
    logEvent("ACCOUNT_UNLOCKED", req.user.username, `Unlocked ${user.username}`);
  } else {
    user.lockedUntil = new Date(Date.now() + 99 * 365 * 24 * 60 * 60 * 1000).toISOString();
    logEvent("ACCOUNT_LOCKED", req.user.username, `Locked ${user.username}`, "WARNING");
  }

  writeJSON("users.json", users);
  res.json({ success: true });
});


// GET /api/logs/export — MUST be before /api/logs
app.get("/api/logs/export", requireAuth, requireAdmin, (req, res) => {
  const logFile = path.join(__dirname, "logs", "security.log");
  if (!fs.existsSync(logFile)) return res.status(404).json({ error: "No logs found" });
  logEvent("LOG_EXPORT", req.user.username, "Admin exported full audit log");
  const content = fs.readFileSync(logFile, "utf8");
  res.setHeader("Content-Disposition", "attachment; filename=securesend_audit_log.txt");
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

// GET /api/logs
app.get("/api/logs", requireAuth, requireAdmin, (req, res) => {
  const logFile = path.join(__dirname, "logs", "security.log");
  if (!fs.existsSync(logFile)) return res.json([]);
  const lines = fs.readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean);
  res.json(lines.map(l => JSON.parse(l)).reverse());
});

//start server w HTTPS self signed certs
const https = require("https");
const sslOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// Remove Express fingerprint
app.disable("x-powered-by");

// 404 handler — return JSON not HTML
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

//handle multer errors cleanly
app.use((err, req, res, next) => {
  if (err.message === "Only PDF and DOCX files are allowed") {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`SecureSend backend running on https://localhost:${PORT}`);
  console.log(`CORS: allowing http://localhost:5173`);
  console.log(`Security headers: X-Frame-Options, CSP, XSS-Protection, etc.`);
  console.log(`Rate limiting: 10 requests/min on /api/login`);
  console.log(`Encryption: AES-256-CBC`);
});