/**
 * Public ReachMe Routes
 * Handles creation, management, and access to public "reach me" URLs
 */

const express = require("express");
const router = express.Router();
const db = require("../src/db");
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

    // Check if the user is an admin
    const isAdmin = req.user.roles && req.user.roles.includes("admin");

    // Determine the target user ID
    const targetUserId = isAdmin && req.body.userId ? req.body.userId : userId;

    if (!isAdmin && reachMe.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    // using src/db adapter

    // Check total and active limits
    const PUBLIC_REACHMES_MAX_TOTAL = parseInt(
      process.env.PUBLIC_REACHMES_MAX_TOTAL || "35",
      10
    );

    const { totalCount, activeCount } = await db.getPublicReachMeCounts(
      targetUserId
    );

    if (totalCount >= PUBLIC_REACHMES_MAX_TOTAL) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum total limit of ${PUBLIC_REACHMES_MAX_TOTAL} public Reach Mes.`,
      });
    }

    if (activeCount >= parseInt(process.env.MAX_PUBLIC_REACHMES || "15", 10)) {
      return res.status(400).json({
        success: false,
        message:
          "You have reached the maximum active limit of public Reach Mes.",
      });
    }

    // Validate deactivation time if provided
    if (deactivateAt) {
      const validation = validateDeactivateTime(deactivateAt, null);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Generate unique code
    const urlCode = await generateUniqueCode(db);

    // Insert into database
    const publicReachMeId = await db.createPublicReachMe(
      targetUserId,
      urlCode,
      deactivateAt || null
    );

    // Add to cache
    // Fetch user email to store in cache so test responses can return it immediately
    let createdUserEmail = null;
    try {
      const user = await db.getUserById(targetUserId);
      createdUserEmail = user ? user.email : null;
    } catch (e) {
      createdUserEmail = null;
    }

    publicReachMeCache.set(urlCode, {
      userId: targetUserId,
      publicReachMeId,
      isActive: true,
      deactivateAt,
    });
    const cached = publicReachMeCache.get(urlCode);
    if (cached) cached.userEmail = createdUserEmail;

    res.json({
      success: true,
      urlCode,
      publicReachMeId,
      url: `/r/${urlCode}/`,
      fullUrl: `${req.protocol}://${req.get("host")}/r/${urlCode}/`,
      userEmail: createdUserEmail,
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

    // using src/db adapter

    // Check ownership
    const publicReachMe = await db.getPublicReachMeByCode(urlCode);

    if (!publicReachMe) {
      return res.status(404).json({ error: "Public ReachMe URL not found" });
    }

    if (publicReachMe.user_id !== userId) {
      return res.status(403).json({ error: "You do not own this URL" });
    }

    if (!publicReachMe.is_active) {
      return res.status(400).json({ error: "URL is already deactivated" });
    }

    // Deactivate in database
    await db.deactivatePublicReachMeByCode(urlCode);

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

      // using src/db adapter

      // Get current data
      const publicReachMe = await db.getPublicReachMeByCode(urlCode);

      if (!publicReachMe) {
        return res.status(404).json({ error: "Public ReachMe URL not found" });
      }

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
      await db.updatePublicReachMeDeactivateAt(urlCode, deactivateAt || null);

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
    // using src/db adapter

    const rows = await db.listPublicReachMesForUser(userId);

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
    const { token, relationship, name, email, phone, message, actionType } =
      req.body;

    if (!token) {
      return res
        .status(400)
        .json({ status: "error", error: "Token is required" });
    }

    // Validation: at least relationship, name, or email required
    if (!relationship && !name && !email) {
      return res.status(400).json({
        status: "error",
        error: "Please provide your name, email, or select a relationship",
      });
    }

    // For send_message action, message is required
    if (actionType === "send_message" && !message) {
      return res
        .status(400)
        .json({ status: "error", error: "Message is required" });
    }

    // using src/db adapter

    // Look up the URL by token (urlCode)
    const urlData = await db.getPublicReachMeByCode(token);

    if (!urlData) {
      return res.status(404).json({ status: "error", error: "Invalid token" });
    }

    // Check if active
    if (!urlData.is_active) {
      return res.status(400).json({
        status: "error",
        error: "This ReachMe URL is no longer active",
      });
    }

    // Create alarm/message NOW (at POST time, not GET)
    const datetimeAlarm = new Date();

    // Auto-deactivate after 1 hour
    const autoDeactivateAt = new Date(datetimeAlarm.getTime() + 60 * 60 * 1000);

    // Prepare sent_details JSON (for now just app, will expand later for WhatsApp, SMS, email)
    const sentDetails = {
      app: {
        sent: false,
        sentAt: null,
        status: "pending",
      },
    };

    await db.insertReachMessage({
      user_id: urlData.user_id,
      public_reachme_id: urlData.id,
      message,
      datetime_alarm: datetimeAlarm,
      sender_info: { relationship, name, email, phone, actionType },
      reached_client: false,
      sent_details: sentDetails,
      auto_deactivate_at: autoDeactivateAt,
    });

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

    // If cache entry exists but lacks userEmail, fetch it so test responses can return the email directly
    if (urlData && !urlData.userEmail) {
      try {
        const user = await db.getUserById(urlData.userId);
        urlData.userEmail = user ? user.email : null;
      } catch (e) {
        urlData.userEmail = null;
      }
    }

    // If not in cache, check database
    if (!urlData) {
      // using src/db adapter
      const urlRow = await db.getPublicReachMeByCode(urlCode);

      if (!urlRow) {
        return res
          .status(404)
          .json({ status: "error", error: "Invalid ReachMe URL" });
      }

      // Ensure we have the user's email available
      let userEmail = urlRow.user_email;
      if (!userEmail) {
        try {
          const user = await db.getUserById(urlRow.user_id);
          userEmail = user ? user.email : null;
        } catch (e) {
          userEmail = null;
        }
      }

      urlData = {
        publicReachMeId: urlRow.id,
        userId: urlRow.user_id,
        userEmail: userEmail,
        isActive: Boolean(urlRow.is_active),
        deactivateAt: urlRow.deactivate_at,
      };

      // Add to cache (cache stores core fields; attach userEmail to cached object)
      publicReachMeCache.set(urlCode, {
        userId: urlData.userId,
        publicReachMeId: urlData.publicReachMeId,
        isActive: urlData.isActive,
        deactivateAt: urlData.deactivateAt,
      });
      const cached = publicReachMeCache.get(urlCode);
      if (cached) cached.userEmail = urlData.userEmail || null;
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
      // Return the user's email directly for test responses (keep userId for legacy compatibility)
      return res.status(200).json({
        status: "test",
        userEmail: urlData.userEmail || null,
        userId: urlData.userEmail || urlData.userId,
      });
    }

    // Create alarm/message
    // using src/db adapter
    const datetimeAlarm = new Date();

    await db.insertReachMessage({
      user_id: urlData.userId,
      public_reachme_id: urlData.publicReachMeId,
      message,
      datetime_alarm: datetimeAlarm,
      sender_info: senderInfo || {},
    });

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
      // using src/db adapter
      const urlRow = await db.getPublicReachMeByCode(urlCode);

      if (!urlRow) {
        return res.status(404).send("Invalid ReachMe URL");
      }

      urlData = {
        publicReachMeId: urlRow.id,
        userId: urlRow.user_id,
        userEmail: urlRow.user_email || urlRow.userId,
        isActive: Boolean(urlRow.is_active),
      };

      publicReachMeCache.set(urlCode, urlData);
    }

    if (!urlData.isActive) {
      return res.status(400).send("This ReachMe URL is no longer active");
    }

    // If mode=web, return HTML form with token
    if (mode === "web") {
      return res.render("contact-form", { urlCode });
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

/**
 * PATCH /public-reachme/edit
 * Edit public Reach Me (activate/deactivate and set deactivation time)
 */
router.patch("/edit", authenticateToken, async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { id, isActive, deactivateAt } = req.body;
  // using src/db adapter

  console.log("PATCH /public-reachme/edit - Request:", {
    userId,
    id,
    isActive,
    deactivateAt,
  });

  try {
    // Check if the Reach Me exists and belongs to the user
    const reachMe = await db.getPublicReachMeById(id, userId);

    if (!reachMe) {
      return res
        .status(404)
        .json({ success: false, message: "Public Reach Me not found." });
    }

    // Check if the user is an admin
    const isAdmin = req.user.roles && req.user.roles.includes("admin");

    // Determine the target user ID
    const targetUserId = isAdmin && req.body.userId ? req.body.userId : userId;

    if (!isAdmin && targetUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    // If activating, check the active limit
    if (isActive && !reachMe.is_active) {
      // Only check limit if currently inactive and trying to activate
      const { activeCount } = await db.getPublicReachMeCounts(targetUserId);

      if (
        activeCount >= parseInt(process.env.MAX_PUBLIC_REACHMES || "15", 10)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You have reached the maximum active limit of public Reach Mes.",
        });
      }
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (typeof isActive !== "undefined") {
      updateFields.push("is_active = ?");
      updateValues.push(isActive);
    }

    if (typeof deactivateAt !== "undefined") {
      updateFields.push("deactivate_at = ?");
      updateValues.push(deactivateAt === null ? null : deactivateAt);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update.",
      });
    }

    // Add WHERE clause values
    updateValues.push(userId, id);

    console.log(
      "Update query:",
      `UPDATE pblcRechms SET ${updateFields.join(
        ", "
      )} WHERE id = ? AND user_id = ?`
    );
    console.log("Update values:", updateValues);

    // Update the Reach Me
    await db.updatePublicReachMeById(id, userId, {
      is_active: typeof isActive !== "undefined" ? isActive : undefined,
      deactivate_at:
        typeof deactivateAt !== "undefined" ? deactivateAt : undefined,
    });

    // Update cache
    const urlCode = reachMe.url_code;
    if (isActive) {
      publicReachMeCache.set(urlCode, {
        userId: userId,
        publicReachMeId: id,
        isActive: true,
        deactivateAt: deactivateAt || null,
      });
    } else if (typeof isActive !== "undefined" && !isActive) {
      // Remove from cache if deactivating
      publicReachMeCache.delete(urlCode);
    }

    res.status(200).json({
      success: true,
      message: "Public Reach Me updated successfully.",
    });
  } catch (error) {
    console.error("Error editing public Reach Me:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to edit public Reach Me" });
  }
});

module.exports = router;
