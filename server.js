const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Path to shared rotated secret file (if mounted)
const SHARED_SECRET_FILE = "/shared-secrets/api_secret.txt";

/**
 * Retrieves the currently active API Secret.
 * 1. Checks shared rotated secret file (written by rotator service).
 * 2. Falls back to environment variable API_SECRET.
 * 3. Falls back to default initial secret.
 */
function getActiveApiSecret() {
  try {
    if (fs.existsSync(SHARED_SECRET_FILE)) {
      const fileContent = fs.readFileSync(SHARED_SECRET_FILE, "utf-8").trim();
      if (fileContent) return fileContent;
    }
  } catch (err) {
    console.warn("[Backend] Could not read shared secret file:", err.message);
  }
  return process.env.API_SECRET || "initial-lab-secret-key-2026";
}

const logDir = "/var/log/app";
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
} catch (err) {}

app.use(cors());
app.use(express.json());

// Access logging middleware for Fail2Ban monitoring
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress || "127.0.0.1";
  const cleanIp = String(ip).replace(/^.*:/, "") || "127.0.0.1";
  
  res.on("finish", () => {
    const logLine = `${cleanIp} - - [${new Date().toISOString()}] "${req.method} ${req.originalUrl || req.url} HTTP/1.1" ${res.statusCode}\n`;
    try {
      fs.appendFile(path.join(logDir, "access.log"), logLine, () => {});
    } catch (e) {}
  });
  next();
});

/**
 * Middleware: Validates that the incoming request contains a valid x-api-key header.
 * Supports hot-reloaded secrets dynamically.
 */
function requireApiKey(req, res, next) {
  const incomingKey = req.headers["x-api-key"];
  const currentKey = getActiveApiSecret();

  if (!incomingKey || incomingKey !== currentKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid x-api-key header.",
      received: incomingKey ? `${incomingKey.substring(0, 3)}***` : "None"
    });
  }

  next();
}

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

// 1. Health check (No API Key required)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Security Secret Rotation Backend API",
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// Protected Endpoints (Requires x-api-key header)
// -------------------------------------------------------------

// 2. Protected GET /api/data
app.get("/api/data", requireApiKey, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Authorized access to protected backend data",
    course: "Application Security and Secret Rotation",
    timestamp: new Date().toISOString()
  });
});

// 3. Protected POST /api/data
app.post("/api/data", requireApiKey, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "POST received successfully with valid API Key",
    receivedBody: req.body
  });
});

// 4. Encrypted Database: Store sensitive record (POST /api/items)
app.post("/api/items", requireApiKey, (req, res) => {
  const { title, content } = req.body;

  if (!content) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Field 'content' is required to store in database."
    });
  }

  const savedRecord = db.insertRecord(title, content);

  res.status(201).json({
    status: "success",
    message: "Data encrypted and stored successfully in the database",
    record: savedRecord
  });
});

// 5. Encrypted Database: Retrieve & Decrypt all records (GET /api/items)
app.get("/api/items", requireApiKey, (req, res) => {
  const records = db.getAllRecords();

  res.status(200).json({
    status: "success",
    count: records.length,
    records: records
  });
});

// 6. Diagnostic endpoint: Check rotation status and masked keys (GET /api/status)
app.get("/api/status", requireApiKey, (req, res) => {
  const currentSecret = getActiveApiSecret();
  const dbKey = process.env.DATABASE_ENCRYPTION_KEY || "default_database_master_key_2026";

  res.status(200).json({
    api_secret_preview: `${currentSecret.substring(0, 4)}...${currentSecret.substring(currentSecret.length - 3)}`,
    api_secret_length: currentSecret.length,
    database_encryption_configured: Boolean(process.env.DATABASE_ENCRYPTION_KEY),
    db_key_preview: `${dbKey.substring(0, 4)}... (STATIC - NO ROTATION)`,
    server_time: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Backend] Security API running on port ${PORT}`);
  console.log(`[Backend] Current API_SECRET active: ${getActiveApiSecret().substring(0, 4)}***`);
  console.log(`[Backend] DATABASE_ENCRYPTION_KEY active (AES-256 enabled)`);
});
