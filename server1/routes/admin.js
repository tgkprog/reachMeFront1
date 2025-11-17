/**
 * Admin Routes
 * Special admin-only endpoints
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { verifyAdminUser } = require("../utils/adminAuth");

/**
 * POST /admin/login
 * Admin login endpoint
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const encryptionKey = process.env.ADMIN_ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error("ADMIN_ENCRYPTION_KEY not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const isValid = verifyAdminUser(email, password, encryptionKey);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email,
        role: "admin",
        isAdmin: true,
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Set cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * Admin authentication middleware
 */
function authenticateAdmin(req, res, next) {
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

      if (!user.isAdmin || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      req.user = user;
      next();
    }
  );
}

/**
 * GET /admin/test
 * Test endpoint for admin authentication
 */
router.get("/test", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin authentication successful",
    user: req.user,
  });
});

module.exports = router;
