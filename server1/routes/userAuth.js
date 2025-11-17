/**
 * User Authentication Routes
 * Handles user login via email/password and Google OAuth
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getDB } = require("../db/connection");

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
 * POST /user/login
 * User login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required",
      });
    }

    const db = getDB();
    const encryptionKey = process.env.ADMIN_ENCRYPTION_KEY;

    if (!encryptionKey) {
      console.error("ADMIN_ENCRYPTION_KEY not set in environment");
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    // Search for user by primary email
    const [users] = await db.execute(
      `SELECT id, email, password_hash, pwdLogin, first_name, last_name, account_status 
       FROM users 
       WHERE email = ? 
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = users[0];

    // Check if password login is enabled for this user
    if (!user.pwdLogin) {
      return res.status(403).json({
        success: false,
        error: "Password login is not enabled for this account",
      });
    }

    // Check account status
    if (user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Account is not active",
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const decryptedPassword = decryptPassword(
      user.password_hash,
      encryptionKey
    );
    if (!decryptedPassword || decryptedPassword !== password) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: "user",
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Set cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    console.error("User login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

/**
 * User authentication middleware
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No authentication token provided",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-jwt-secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: "Invalid or expired token",
        });
      }

      req.user = user;
      next();
    }
  );
}

/**
 * GET /user/me
 * Get current user info
 */
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const db = getDB();

    const [users] = await db.execute(
      `SELECT id, email, first_name, last_name, account_status, pwdLogin, googleOauth, USER_GOOGLE_EMAIL
       FROM users 
       WHERE id = ? 
       LIMIT 1`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountStatus: user.account_status,
        pwdLogin: user.pwdLogin,
        googleOauth: user.googleOauth,
        googleEmail: user.USER_GOOGLE_EMAIL,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user info",
    });
  }
});

/**
 * POST /user/logout
 * Logout endpoint
 */
router.post("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
module.exports.authenticateUser = authenticateUser;
