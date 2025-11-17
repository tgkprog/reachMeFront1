/**
 * Admin Authentication Utilities
 * Handles password encryption/verification for admin users
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Encryption configuration
const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive a 32-byte key from the encryption key
 */
function deriveKey(baseKey) {
  return crypto.createHash("sha256").update(baseKey).digest();
}

/**
 * Encrypt password with salt
 */
function encryptPassword(password, encryptionKey) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = deriveKey(encryptionKey);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    salt,
    encrypted: `${iv.toString("hex")}:${encrypted}`,
  };
}

/**
 * Decrypt password
 */
function decryptPassword(encryptedData, encryptionKey) {
  const key = deriveKey(encryptionKey);
  const [ivHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Load admin users from file
 */
function loadAdminUsers() {
  const adminFilePath = path.join(__dirname, "../admin.users");

  if (!fs.existsSync(adminFilePath)) {
    return [];
  }

  const content = fs.readFileSync(adminFilePath, "utf8");
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line && !line.startsWith("#"));

  return lines.map((line) => {
    const [email, salt, encrypted] = line.split("|");
    return { email, salt, encrypted };
  });
}

/**
 * Save admin users to file
 */
function saveAdminUsers(users) {
  const adminFilePath = path.join(__dirname, "../admin.users");
  const content = [
    "# Admin Users - Email|Salt|EncryptedPassword",
    ...users.map((u) => `${u.email}|${u.salt}|${u.encrypted}`),
  ].join("\n");

  fs.writeFileSync(adminFilePath, content, "utf8");
}

/**
 * Add or update admin user
 */
function setAdminUser(email, password, encryptionKey) {
  const users = loadAdminUsers();
  const { salt, encrypted } = encryptPassword(password, encryptionKey);

  const existingIndex = users.findIndex((u) => u.email === email);

  if (existingIndex >= 0) {
    users[existingIndex] = { email, salt, encrypted };
  } else {
    users.push({ email, salt, encrypted });
  }

  saveAdminUsers(users);
  return { email, salt, encrypted };
}

/**
 * Verify admin credentials
 */
function verifyAdminUser(email, password, encryptionKey) {
  const users = loadAdminUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return false;
  }

  try {
    const decrypted = decryptPassword(user.encrypted, encryptionKey);
    return decrypted === password;
  } catch (error) {
    console.error("Error verifying admin password:", error);
    return false;
  }
}

module.exports = {
  encryptPassword,
  decryptPassword,
  loadAdminUsers,
  saveAdminUsers,
  setAdminUser,
  verifyAdminUser,
};
