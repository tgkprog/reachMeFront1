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

    // TODO: Fetch commands from database for this device
    // Example: SELECT * FROM commands WHERE device_id = ? AND status = 'pending'

    const commands = [
      // Example command (remove in production)
      // {
      //   type: 'alert',
      //   tone: 'preset',
      //   title: 'Test Alert',
      //   msg: 'This is a test notification from ReachMe server',
      // }
    ];

    // Server's minimum poll time (in seconds)
    const min_poll_time = 30;

    res.json({
      commands,
      min_poll_time,
    });
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
    const { getDB } = require("../db/connection");
    const db = getDB();

    const [rows] = await db.execute(
      `SELECT 
        id, 
        public_reachme_id, 
        message, 
        datetime_alarm, 
        is_ack_app, 
        is_ack_all, 
        sender_info, 
        created_at 
       FROM reach_me_messages 
       WHERE user_id = ? 
       ORDER BY datetime_alarm DESC`,
      [userId]
    );

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
      const { getDB } = require("../db/connection");
      const db = getDB();

      // Verify ownership
      const [rows] = await db.execute(
        "SELECT user_id FROM reach_me_messages WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Message not found" });
      }

      if (rows[0].user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update acknowledgment
      if (ackType === "app") {
        await db.execute(
          "UPDATE reach_me_messages SET is_ack_app = TRUE WHERE id = ?",
          [id]
        );
      } else if (ackType === "all") {
        await db.execute(
          "UPDATE reach_me_messages SET is_ack_all = TRUE WHERE id = ?",
          [id]
        );
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
