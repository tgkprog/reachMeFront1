const crypto = require("crypto");

/**
 * Decrypt password using AES-256-CBC (matching admin encryption)
 */
function decryptPassword(encryptedData, encryptionKey) {
  try {
    const ALGORITHM = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(encryptionKey).digest();

    // Split IV and encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting password:", error.message);
    return null;
  }
}

/**
 * Encrypt password using AES-256-CBC (matching admin encryption)
 */
function encryptPassword(password, encryptionKey) {
  const ALGORITHM = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(encryptionKey).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

module.exports = {
  encryptPassword,
  decryptPassword,
};
