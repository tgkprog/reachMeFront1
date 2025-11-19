#!/usr/bin/env node
/**
 * Encryption Utility
 * Encrypts a string using the shared encryption key
 *
 * Usage: node src/enc.js "your-password-here"
 */

const crypto = require("crypto");
const { loadEnv } = require("./utils/loadEnv");

// Load environment configuration
loadEnv(__dirname);

// Configuration from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";
const ALGORITHM = "aes-256-cbc";

if (!process.env.ENCRYPTION_KEY) {
  console.warn(
    "⚠️  ENCRYPTION_KEY not found in environment; using default seeded value."
  );
}

/**
 * Derive a 32-byte key from the encryption key
 */
function deriveKey(baseKey) {
  return crypto.createHash("sha256").update(baseKey).digest();
}

/**
 * Encrypt password with salt
 */
function encryptPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  const encryptedData = `${iv.toString("hex")}:${encrypted}`;

  return {
    salt,
    encrypted: encryptedData,
  };
}

// Main execution
if (require.main === module) {
  const input = process.argv[2];

  if (!input) {
    console.error('Usage: node src/enc.js "your-string-here"');
    process.exit(1);
  }

  const result = encryptPassword(input);

  console.log("\n🔐 Encryption Result:");
  console.log("─────────────────────────────────────────");
  console.log("Salt:      ", result.salt);
  console.log("Encrypted: ", result.encrypted);
  console.log("─────────────────────────────────────────");
  console.log("\nFor .admin.users file format:");
  console.log(`email|${result.salt}|${result.encrypted}`);
  console.log("");
}

module.exports = { encryptPassword };
