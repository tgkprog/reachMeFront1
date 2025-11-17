/**
 * Public ReachMe Routes
 * Handles creation, management, and access to public "reach me" URLs
 */

const express = require("express");
const router = express.Router();
const { getDB } = require("../db/connection");
const publicReachMeCache = require("../utils/cache");
const {
  generateUniqueCode,
  validateDeactivateTime,
} = require("../utils/helpers");

// JWT auth middleware (from api.js)
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
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

/**
 * POST /public-reachme/create
 * Create a new public ReachMe URL
 */
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { deactivateAt } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID not found in token" });
    }

    // Validate deactivation time if provided
    if (deactivateAt) {
      const validation = validateDeactivateTime(deactivateAt, null);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    const db = getDB();

    // Generate unique code
    const urlCode = await generateUniqueCode(db);

    // Insert into database
    const [result] = await db.execute(
      `INSERT INTO pblcRechms (user_id, url_code, is_active, deactivate_at) 
       VALUES (?, ?, TRUE, ?)`,
      [userId, urlCode, deactivateAt || null]
    );

    const publicReachMeId = result.insertId;

    // Add to cache
    publicReachMeCache.set(urlCode, {
      userId,
      publicReachMeId,
      isActive: true,
      deactivateAt,
    });

    res.json({
      success: true,
      urlCode,
      publicReachMeId,
      url: `/r/${urlCode}/`,
      fullUrl: `${req.protocol}://${req.get("host")}/r/${urlCode}/`,
      isActive: true,
      deactivateAt: deactivateAt || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating public ReachMe:", error);
    res.status(500).json({ error: "Failed to create public ReachMe URL" });
  }
});

/**
 * POST /public-reachme/deactivate/:urlCode
 * Deactivate a public ReachMe URL
 */
router.post("/deactivate/:urlCode", authenticateToken, async (req, res) => {
  try {
    const { urlCode } = req.params;
    const userId = req.user.id || req.user.userId;

    const db = getDB();

    // Check ownership
    const [rows] = await db.execute(
      "SELECT id, user_id, is_active FROM pblcRechms WHERE url_code = ?",
      [urlCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Public ReachMe URL not found" });
    }

    const publicReachMe = rows[0];

    if (publicReachMe.user_id !== userId) {
      return res.status(403).json({ error: "You do not own this URL" });
    }

    if (!publicReachMe.is_active) {
      return res.status(400).json({ error: "URL is already deactivated" });
    }

    // Deactivate in database
    await db.execute(
      "UPDATE pblcRechms SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE url_code = ?",
      [urlCode]
    );

    // Deactivate in cache
    publicReachMeCache.deactivate(urlCode);

    res.json({
      success: true,
      message: "Public ReachMe URL deactivated",
      urlCode,
    });
  } catch (error) {
    console.error("Error deactivating public ReachMe:", error);
    res.status(500).json({ error: "Failed to deactivate public ReachMe URL" });
  }
});

/**
 * PUT /public-reachme/update-deactivate/:urlCode
 * Update deactivation time for a public ReachMe URL
 */
router.put(
  "/update-deactivate/:urlCode",
  authenticateToken,
  async (req, res) => {
    try {
      const { urlCode } = req.params;
      const { deactivateAt } = req.body;
      const userId = req.user.id || req.user.userId;

      const db = getDB();

      // Get current data
      const [rows] = await db.execute(
        "SELECT id, user_id, is_active, deactivate_at FROM pblcRechms WHERE url_code = ?",
        [urlCode]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Public ReachMe URL not found" });
      }

      const publicReachMe = rows[0];

      if (publicReachMe.user_id !== userId) {
        return res.status(403).json({ error: "You do not own this URL" });
      }

      if (!publicReachMe.is_active) {
        return res
          .status(400)
          .json({ error: "Cannot update deactivation time for inactive URL" });
      }

      // Validate new deactivation time
      const validation = validateDeactivateTime(
        deactivateAt,
        publicReachMe.deactivate_at
      );
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Update in database
      await db.execute(
        "UPDATE pblcRechms SET deactivate_at = ?, updated_at = CURRENT_TIMESTAMP WHERE url_code = ?",
        [deactivateAt || null, urlCode]
      );

      // Update in cache
      publicReachMeCache.updateDeactivateAt(urlCode, deactivateAt);

      res.json({
        success: true,
        message: "Deactivation time updated",
        urlCode,
        deactivateAt: deactivateAt || null,
      });
    } catch (error) {
      console.error("Error updating deactivation time:", error);
      res.status(500).json({ error: "Failed to update deactivation time" });
    }
  }
);

/**
 * GET /public-reachme/list
 * List all public ReachMe URLs for the authenticated user
 */
router.get("/list", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const db = getDB();

    const [rows] = await db.execute(
      `SELECT id, url_code, is_active, deactivate_at, created_at, updated_at 
       FROM pblcRechms 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    const urls = rows.map((row) => ({
      id: row.id,
      urlCode: row.url_code,
      url: `/r/${row.url_code}/`,
      fullUrl: `${req.protocol}://${req.get("host")}/r/${row.url_code}/`,
      isActive: Boolean(row.is_active),
      deactivateAt: row.deactivate_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      count: urls.length,
      urls,
    });
  } catch (error) {
    console.error("Error listing public ReachMe URLs:", error);
    res.status(500).json({ error: "Failed to retrieve URLs" });
  }
});

/**
 * POST /user/reach
 * Submit a message through web form (receives token + visible fields)
 * This is where the alarm is created (not on GET)
 */
router.post("/user/reach", async (req, res) => {
  try {
    const { token, name, email, message } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ status: "error", error: "Token is required" });
    }

    if (!message) {
      return res
        .status(400)
        .json({ status: "error", error: "Message is required" });
    }

    if (!name || !email) {
      return res
        .status(400)
        .json({ status: "error", error: "Name and email are required" });
    }

    const db = getDB();

    // Look up the URL by token (urlCode)
    const [rows] = await db.execute(
      `SELECT p.id, p.user_id, p.is_active, u.email as user_email 
       FROM pblcRechms p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.url_code = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", error: "Invalid token" });
    }

    const urlData = rows[0];

    // Check if active
    if (!urlData.is_active) {
      return res.status(400).json({
        status: "error",
        error: "This ReachMe URL is no longer active",
      });
    }

    // Create alarm/message NOW (at POST time, not GET)
    const datetimeAlarm = new Date();

    await db.execute(
      `INSERT INTO reach_me_messages 
       (user_id, public_reachme_id, message, datetime_alarm, sender_info) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        urlData.user_id,
        urlData.id,
        message,
        datetimeAlarm,
        JSON.stringify({ name, email }),
      ]
    );

    res.json({
      status: "ok",
      message: "Your message has been sent successfully",
    });
  } catch (error) {
    console.error("Error submitting message via /user/reach:", error);
    res.status(500).json({ status: "error", error: "Failed to send message" });
  }
});

/**
 * POST /r/:urlCode/
 * Submit a message through a public ReachMe URL
 * Query param ?test=true for testing without creating alarm
 */
router.post("/:urlCode/", async (req, res) => {
  try {
    const { urlCode } = req.params;
    const { message, senderInfo } = req.body;
    const isTest = req.query.test === "true";

    if (!message && !isTest) {
      return res
        .status(400)
        .json({ status: "error", error: "Message is required" });
    }

    // Check cache first
    let urlData = publicReachMeCache.get(urlCode);

    // If not in cache, check database
    if (!urlData) {
      const db = getDB();
      const [rows] = await db.execute(
        `SELECT p.id, p.user_id, p.is_active, p.deactivate_at, u.email 
         FROM pblcRechms p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.url_code = ?`,
        [urlCode]
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ status: "error", error: "Invalid ReachMe URL" });
      }

      urlData = {
        publicReachMeId: rows[0].id,
        userId: rows[0].user_id,
        userEmail: rows[0].email,
        isActive: Boolean(rows[0].is_active),
        deactivateAt: rows[0].deactivate_at,
      };

      // Add to cache
      publicReachMeCache.set(urlCode, urlData);
    }

    // Check if active
    if (!urlData.isActive) {
      return res.status(400).json({
        status: "error",
        error: "This ReachMe URL is no longer active",
      });
    }

    // Test mode: just return user email without creating alarm
    if (isTest) {
      return res.status(200).json({
        status: "test",
        userId: urlData.userEmail || urlData.userId,
      });
    }

    // Create alarm/message
    const db = getDB();
    const datetimeAlarm = new Date();

    await db.execute(
      `INSERT INTO reach_me_messages 
       (user_id, public_reachme_id, message, datetime_alarm, sender_info) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        urlData.userId,
        urlData.publicReachMeId,
        message,
        datetimeAlarm,
        JSON.stringify(senderInfo || {}),
      ]
    );

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error submitting ReachMe message:", error);
    res.status(500).json({ status: "error", error: "Failed to send message" });
  }
});

/**
 * GET /r/:urlCode/
 * Display public contact form when ?mode=web
 * Returns HTML form with hidden token linked to user
 */
router.get("/:urlCode/", async (req, res) => {
  try {
    const { urlCode } = req.params;
    const { mode } = req.query;

    // Check if URL exists and is active
    let urlData = publicReachMeCache.get(urlCode);

    if (!urlData) {
      const db = getDB();
      const [rows] = await db.execute(
        `SELECT p.id, p.user_id, p.is_active, u.email 
         FROM pblcRechms p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.url_code = ?`,
        [urlCode]
      );

      if (rows.length === 0) {
        return res.status(404).send("Invalid ReachMe URL");
      }

      urlData = {
        publicReachMeId: rows[0].id,
        userId: rows[0].user_id,
        userEmail: rows[0].email,
        isActive: Boolean(rows[0].is_active),
      };

      publicReachMeCache.set(urlCode, urlData);
    }

    if (!urlData.isActive) {
      return res.status(400).send("This ReachMe URL is no longer active");
    }

    // If mode=web, return HTML form with token
    if (mode === "web") {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ReachMe - Contact Form</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            form { margin-top: 20px; }
            input, textarea { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
            button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
            button:hover { background: #0056b3; }
            .success { color: green; margin-top: 20px; }
            .error { color: red; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Send a Message</h1>
          <form id="contactForm">
            <input type="hidden" name="token" value="${urlCode}">
            <input type="text" name="name" placeholder="Your name" required>
            <input type="email" name="email" placeholder="Your email" required>
            <textarea name="message" placeholder="Your message" rows="6" required></textarea>
            <button type="submit">Send Message</button>
          </form>
          <div id="result"></div>
          <script>
            document.getElementById('contactForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const resultDiv = document.getElementById('result');
              
              try {
                const response = await fetch('/user/reach', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: formData.get('token'),
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                  })
                });
                
                const result = await response.json();
                
                if (result.status === 'ok') {
                  resultDiv.className = 'success';
                  resultDiv.textContent = 'Message sent successfully!';
                  e.target.reset();
                  document.querySelector('input[name="token"]').value = '${urlCode}';
                } else {
                  resultDiv.className = 'error';
                  resultDiv.textContent = result.error || 'Failed to send message';
                }
              } catch (error) {
                resultDiv.className = 'error';
                resultDiv.textContent = 'Error sending message: ' + error.message;
              }
            });
          </script>
        </body>
        </html>
      `);
    } else {
      // Default JSON response for API access
      res.json({
        success: true,
        urlCode,
        isActive: urlData.isActive,
        message:
          "ReachMe URL is active. Use ?mode=web to display the contact form.",
      });
    }
  } catch (error) {
    console.error("Error displaying contact form:", error);
    res.status(500).send("Error loading contact form");
  }
});

module.exports = router;
