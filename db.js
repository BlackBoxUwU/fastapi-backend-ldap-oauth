const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Database file path for persistence
const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "encrypted_records.json");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf-8");
}

/**
 * Gets the 32-byte encryption key derived from the DATABASE_ENCRYPTION_KEY env variable.
 * IMPORTANT: This key MUST NOT be rotated to preserve access to existing encrypted data.
 */
function getEncryptionKey() {
  const secretKey = process.env.DATABASE_ENCRYPTION_KEY || "default_database_master_key_2026";
  return crypto.createHash("sha256").update(String(secretKey)).digest();
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns: "iv_hex:ciphertext_hex"
 */
function encryptData(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext formatted as "iv_hex:ciphertext_hex" using AES-256-CBC.
 */
function decryptData(encryptedText) {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
    let decrypted = decipher.update(parts[1], "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Database] Decryption failed:", error.message);
    return "[DECRYPTION_ERROR: Invalid key or corrupted data]";
  }
}

/**
 * Reads raw records from database file.
 */
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes raw records to database file.
 */
function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Inserts a new record into the database, encrypting its sensitive payload.
 */
function insertRecord(title, sensitiveContent) {
  const records = readDb();
  const encryptedPayload = encryptData(sensitiveContent);

  const newRecord = {
    id: Date.now().toString(),
    title: title || "Untitled Record",
    encryptedData: encryptedPayload, // Stored encrypted in the database
    createdAt: new Date().toISOString()
  };

  records.push(newRecord);
  writeDb(records);

  return {
    ...newRecord,
    decryptedContent: sensitiveContent // Returned to caller
  };
}

/**
 * Retrieves all records from the database and decrypts their sensitive payload.
 */
function getAllRecords() {
  const records = readDb();
  return records.map(record => ({
    id: record.id,
    title: record.title,
    encryptedData: record.encryptedData, // Raw ciphertext stored in DB
    decryptedContent: decryptData(record.encryptedData), // Decrypted for API response
    createdAt: record.createdAt
  }));
}

module.exports = {
  encryptData,
  decryptData,
  insertRecord,
  getAllRecords,
  getEncryptionKey
};
