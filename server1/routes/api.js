/**
 * API Routes
 *
 * Core API endpoints for ReachMe application
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// ===================================
// Middleware: JWT Authentication
// ===================================
function authenticateToken(req, res, next) {
  // Check for token in Authorization header or cookie
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-jwt-secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    }
  );
}

// ===================================
// Public Endpoints
// ===================================

/**
 * POST /api/user/check
 * Check if user is allowed to login
 */
router.post("/user/check", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        allowed: false,
        message: "Email is required",
      });
    }

    // TODO: Check against database if user is allowed
    // For now, allow all users with valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);

    if (!isValidEmail) {
      return res.json({
        allowed: false,
        message: "Invalid email format",
      });
    }

    // TODO: Check user status in database
    // Example: SELECT * FROM users WHERE email = ? AND status = 'active'
    const isAllowed = true; // Placeholder

    res.json({
      allowed: isAllowed,
      message: isAllowed ? "" : "You are not authorized to use this app",
    });
  } catch (error) {
    console.error("User check error:", error);
    res.status(500).json({
      allowed: false,
      message: "Internal server error",
    });
  }
});

/**
 * POST /api/user/register
 * Register a new user
 */
router.post("/user/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const db = require("../src/db");
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    // Check if user already exists
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Encrypt password
    const crypto = require("crypto");
    const encryptPassword = (password, encryptionKey) => {
      const ALGORITHM = "aes-256-cbc";
      const key = crypto.createHash("sha256").update(encryptionKey).digest();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      let encrypted = cipher.update(password, "utf8", "hex");
      encrypted += cipher.final("hex");

      return iv.toString("hex") + ":" + encrypted;
    };

    const encryptedPassword = encryptPassword(password, encryptionKey);

    // Create user via adapter
    const userId = await db.createUser({
      email,
      password_hash: encryptedPassword,
      first_name: firstName,
      last_name: lastName,
      pwdLogin: true,
      account_status: "active",
    });

    res.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: userId,
        email,
        firstName,
        lastName,
      },
    });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

/**
 * POST /api/user/forgot-password
 * Send password reset email
 */
router.post("/user/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // TODO: Implement password reset logic
    // For now, just return success
    console.log(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
});

/**
 * POST /api/user/passwordLogin
 * User login with email and password (alias for /user/login)
 */
router.post("/user/passwordLogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const db = require("../src/db");
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    // Search for user by primary email
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password login is enabled for this user
    if (!user.pwdLogin) {
      return res.status(403).json({
        success: false,
        message: "Password login is not enabled for this account",
      });
    }

    // Check account status
    if (user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Decrypt password using AES-256-CBC
    const crypto = require("crypto");
    const decryptPassword = (encryptedData, encryptionKey) => {
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
    };

    const decryptedPassword = decryptPassword(user.password_hash, encryptionKey);
    if (!decryptedPassword || decryptedPassword !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const jwt = require("jsonwebtoken");
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

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
    console.error("User password login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// ===================================
// Protected Endpoints (Require Authentication)
// ===================================

/**
 * GET /reachme/check
 * Poll for pending commands
 */
router.get("/check", authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.query;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }

    // Determine user id/email from JWT payload
    const userId = req.user.id || req.user.userId || null;
    const userEmail = req.user.email || null;
    if (!userId && !userEmail) {
      return res.status(400).json({ error: "User context missing" });
    }

    // Fetch recent unacknowledged reach_me_messages for this user (limit 10)
    // These become 'alert' commands for the client
    const db = require("../src/db");

    // Prefer user_id match; fallback to email -> userId
    let rows = [];
    if (userId) {
      rows = await db.getRecentUnacknowledgedMessagesForUser(userId, 10);
    } else if (userEmail) {
      const u = await db.getUserByEmail(userEmail);
      if (u && u.id) {
        rows = await db.getRecentUnacknowledgedMessagesForUser(u.id, 10);
      }
    }

    const commands = rows.map((row) => {
      let sender = {};
      try {
        sender = row.sender_info ? JSON.parse(row.sender_info) : {};
      } catch (e) {
        sender = {};
      }
      const name = sender.name || "";
      const relationship = sender.relationship || "";
      const email = sender.email || "";
      const phone = sender.phone || "";
      const createDate =
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at || new Date().toISOString();
      return {
        type: "alert",
        id: String(row.id),
        create_date: createDate,
        tone: "preset", // Placeholder; extend when custom tones/files implemented
        title: "ReachMe Alert", // Generic title; client can override if needed
        msg: row.message || "(no message)",
        name,
        relationship,
        email,
        phone,
      };
    });

    // Server's minimum poll time (in seconds)
    const min_poll_time = parseInt(
      process.env.MIN_POLL_TIME_SECONDS || "10",
      10
    );

    res.json({ commands, min_poll_time });
  } catch (error) {
    console.error("Command polling error:", error);
    res.status(500).json({ error: "Failed to fetch commands" });
  }
});

/**
 * GET /getFile
 * Download audio file by ID
 */
router.get("/file", authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "File ID is required" });
    }

    // TODO: Implement file retrieval logic
    // Example: Fetch file path from database, then stream the file
    // const filePath = await getFilePathFromDB(id);
    // res.sendFile(filePath);

    res.status(404).json({ error: "File not found" });
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

/**
 * POST /api/command
 * Create a new command for a device
 */
router.post("/command", authenticateToken, async (req, res) => {
  try {
    const { deviceId, type, ...commandData } = req.body;

    if (!deviceId || !type) {
      return res
        .status(400)
        .json({ error: "Device ID and command type are required" });
    }

    // Validate command type
    const validTypes = [
      "download",
      "alert",
      "forward",
      "mute",
      "sleep",
      "wake",
      "logout",
      "wipe",
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid command type" });
    }

    // TODO: Save command to database
    // Example: INSERT INTO commands (device_id, type, data, status) VALUES (?, ?, ?, 'pending')

    res.json({
      success: true,
      message: "Command created successfully",
    });
  } catch (error) {
    console.error("Command creation error:", error);
    res.status(500).json({ error: "Failed to create command" });
  }
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get("/user/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user,
  });
});

/**
 * POST /api/device/register
 * Register a new device for a user
 */
router.post("/device/register", authenticateToken, async (req, res) => {
  try {
    const { deviceId, platform, deviceName } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }

    // TODO: Save device to database
    // Example: INSERT INTO devices (user_email, device_id, platform, name) VALUES (?, ?, ?, ?)

    res.json({
      success: true,
      message: "Device registered successfully",
      deviceId,
    });
  } catch (error) {
    console.error("Device registration error:", error);
    res.status(500).json({ error: "Failed to register device" });
  }
});

/**
 * GET /api/reachme/messages
 * Get all ReachMe messages/alarms for the authenticated user
 */
router.get("/reachme/messages", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const db = require("../src/db");

    const rows = await db.getMessagesForUser(userId);

    const messages = rows.map((row) => ({
      id: row.id,
      publicReachMeId: row.public_reachme_id,
      message: row.message,
      datetimeAlarm: row.datetime_alarm,
      isAckApp: Boolean(row.is_ack_app),
      isAckAll: Boolean(row.is_ack_all),
      senderInfo: row.sender_info ? JSON.parse(row.sender_info) : null,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Error fetching ReachMe messages:", error);
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

/**
 * PUT /api/reachme/messages/:id/acknowledge
 * Acknowledge a ReachMe message
 */
router.put(
  "/reachme/messages/:id/acknowledge",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ackType } = req.body; // 'app' or 'all'
      const userId = req.user.id || req.user.userId;
      const db = require("../src/db");

      // Verify ownership via adapter
      const msg = await db.getMessageById(id);
      if (!msg) return res.status(404).json({ error: "Message not found" });
      if (msg.user_id !== userId)
        return res.status(403).json({ error: "Unauthorized" });

      // Update acknowledgment via adapter helper
      if (ackType === "app") {
        await db.acknowledgeMessageById(id, "app");
      } else if (ackType === "all") {
        await db.acknowledgeMessageById(id, "all");
      } else {
        return res
          .status(400)
          .json({ error: 'Invalid ackType. Use "app" or "all"' });
      }

      res.json({
        success: true,
        message: "Message acknowledged",
      });
    } catch (error) {
      console.error("Error acknowledging message:", error);
      res.status(500).json({ error: "Failed to acknowledge message" });
    }
  }
);

module.exports = router;
